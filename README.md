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
