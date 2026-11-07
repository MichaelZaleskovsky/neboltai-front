# Neboltai

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.0.

## Development server

### Backend selection

The backend is selected automatically by the Angular build configuration:

- Local development: `npm start` uses `proxy.conf.json` to forward `/api` requests to `http://192.168.8.104:8080`.
- Production / VM: the Docker build runs `npm run build`, which replaces `environment.ts` with `environment.prod.ts`. Its `apiBaseUrl` is empty, so the browser sends `/api` requests to the same origin as the frontend. Nginx forwards those requests to the backend.

Commit both configurations to Git. Pushing to GitHub does not select the environment; the build command does. No address changes are needed between local development and production. The development proxy is used only by `ng serve`; production routing is handled by Nginx.

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Server deployment (Docker and Nginx)

The VM runs the frontend in Docker, with Nginx on the host acting as the public reverse proxy:

- Page and static asset requests go through Nginx to `http://127.0.0.1:4000` (the frontend container).
- `/api` and `/api/...` requests go through Nginx to the backend, preserving the `/api` path. This includes image uploads, previews and crop requests.

The backend upstream address is configured in Nginx, not in the frontend source. The Nginx configuration is maintained on the server and is not included in this repository.

### Deploy or update

From the repository directory on the VM, with the intended deployment branch checked out:

```bash
git pull --ff-only
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 frontend
```

The Dockerfile installs dependencies and builds the production application using Node 22. The runtime container starts the Angular Node server on port 4000. `docker-compose.yml` publishes this port only on the host loopback interface (`127.0.0.1:4000`) for Nginx to access. There is no need to run `npm ci`, `npm run build`, or the Node server separately on the VM host.

Nginx must route API requests to the backend before its general frontend route. Configure its upload size limit and proxy timeouts to accommodate the expected TIFF/JPEG file sizes and processing times.

If the Nginx configuration changes, validate it before reloading:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

A frontend-only update does not require an Nginx reload. After deployment, check the public site, `/account/adminpanel`, and an API request such as `/api/authors`. API requests should return backend responses rather than frontend HTML.

### Large image uploads

After an upload error, Load becomes available again if a file, name and author are still selected. There are no automatic upload retries: a lost response does not prove that the server did not save the image. Check the backend logs before retrying an ambiguous upload.

For large TIFF/JPEG files, inspect the active Nginx configuration with `sudo nginx -T`. In the existing API location that forwards `/api/artworks/addImage` to the backend, consider the following starting values (adjust to your upload policy and measured processing times):

```nginx
# Add to the existing backend API location; retain its proxy_pass and headers.
client_max_body_size 1g;
client_body_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 900s;
```

`client_max_body_size` limits the entire request, including multipart overhead. The timeouts above measure idle intervals between read/write operations, not the total upload duration. A long preview-generation step without a backend response can hit `proxy_read_timeout`. Validate with `sudo nginx -t` and reload Nginx after configuration changes. See the [Nginx core directives](https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size) and [proxy directives](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout).

Request buffering is enabled by default: Nginx may spool large request bodies to its temporary directory. Check free disk space and permissions there. If the backend supports streaming multipart uploads, consider `proxy_request_buffering off;` together with `proxy_http_version 1.1;` in the upload location. This changes when the backend receives the body; it does not fix backend memory use or preview processing failures. See [request buffering](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_request_buffering).

To diagnose a failure, correlate the browser Network entry for `addImage` (URL, HTTP status, timing) with the Nginx access/error logs and backend container logs at the same time:

- HTTP 413: request body exceeds a size limit in Nginx, another proxy, or the backend.
- HTTP 504 / `upstream timed out`: upstream processing exceeded a proxy timeout.
- HTTP 502 / `upstream prematurely closed connection`: inspect backend failures, restarts and memory limits.
- `Failed to fetch` / HTTP status 0: the browser could not obtain a readable response; this alone does not identify the cause. Check connection resets, browser console errors, redirects, and any additional proxies/CDN.

Check the backend's own multipart size limits, temporary disk space, and Docker memory/OOM status. A compressed TIFF can require much more RAM when decoded than its file size. The frontend container is not the upload backend: use the actual backend container name when examining `docker logs`, `docker stats`, and `docker inspect` (`State.OOMKilled`, restart count and memory limit). Increasing Nginx timeouts will not resolve an out-of-memory failure.

For consistently slow preview generation, a more reliable backend design is to store the upload, return an image/job ID promptly, and generate previews asynchronously while the client polls processing status. This requires a backend API change.

### Inspect the running VM without restarting services

Run these commands over SSH on the Linux VM. Identify the actual backend container, which may be managed by a different Compose project from the frontend:

```bash
date -Is
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Set its name for subsequent commands:

```bash
BACKEND_CONTAINER=your-backend-container
docker inspect "$BACKEND_CONTAINER" --format 'Status={{.State.Status}} OOMKilled={{.State.OOMKilled}} ExitCode={{.State.ExitCode}} Restarts={{.RestartCount}} MemoryLimitBytes={{.HostConfig.Memory}}'
docker logs --since 30m --timestamps "$BACKEND_CONTAINER"
free -h
df -h
df -i
sudo journalctl -k --since '30 minutes ago' | grep -Ei 'oom|out of memory|killed process'
```

`MemoryLimitBytes=0` means Docker has no explicit container memory limit; host RAM and JVM heap limits can still constrain the backend. A Java `OutOfMemoryError` need not set `OOMKilled=true`. Inspect backend multipart limits, JVM options and application configuration in its deployment project as well. If the image contains a shell, check its writable temporary storage:

```bash
docker exec "$BACKEND_CONTAINER" sh -c 'df -h /tmp; df -i /tmp'
docker inspect "$BACKEND_CONTAINER" --format '{{json .Mounts}}'
```

For Nginx installed on the host (the deployment described above):

```bash
sudo nginx -T
sudo tail -n 100 /var/log/nginx/error.log
sudo tail -n 100 /var/log/nginx/access.log
```

Use the log paths shown by `nginx -T` if they differ. Read the `server` block for the public domain and the matching API `location`, including inherited size/time limits, `proxy_pass`, buffering and temporary directory settings. If Nginx itself runs in Docker, use `docker exec NGINX_CONTAINER nginx -T` and `docker logs --since 30m NGINX_CONTAINER` instead (substitute the actual container name).

Before one controlled reproduction, open separate SSH terminals for live monitoring:

```bash
docker stats "$BACKEND_CONTAINER"
```

```bash
docker logs --since 1m --timestamps -f "$BACKEND_CONTAINER"
```

```bash
sudo tail -F /var/log/nginx/error.log /var/log/nginx/access.log
```

Set `BACKEND_CONTAINER` in each terminal that uses it. In browser DevTools enable Network / Preserve log, reproduce once, and record the upload URL, status/error, elapsed time, Timing tab, response and Console error. Afterwards repeat `docker inspect` to compare restart/OOM state. `Ctrl+C` stops these monitoring commands without stopping containers. No restart, rebuild or prune is required for these checks.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
