# Jenkins Practice

A small, hands-on Jenkins setup: Jenkins runs in Docker on your machine and builds, tests and packages a tiny Node.js app every time you push.

```
jenkins-practice/
├── app/                  # the sample Node.js app (no dependencies, built-in test runner)
│   ├── src/              #   greet.js (logic) and server.js (HTTP server)
│   └── test/             #   unit + HTTP tests
├── jenkins/
│   ├── Dockerfile        # Jenkins LTS + Node.js 22 + plugins baked in
│   ├── plugins.txt       # which plugins to install
│   └── casc/jenkins.yaml # Configuration as Code: admin user, executors, URL
├── docker-compose.yml    # one command to start Jenkins
├── Jenkinsfile           # the pipeline: Checkout > Build > Test > Package
└── .env.example          # admin login, copy to .env
```

## Concepts in two minutes

- **Controller**: the Jenkins server (web UI, job config, scheduling). Here it is the `jenkins-practice` container.
- **Agent / executor**: where build steps actually run. To keep things simple this setup runs builds on the controller (2 executors). Real setups use separate agents.
- **Job**: a configured thing Jenkins can build. You'll make a **Pipeline** job.
- **Pipeline / Jenkinsfile**: the build steps as code, stored in the repo. This one is *declarative* (`pipeline { stages { ... } }`).
- **Stage / step**: a stage is a named phase shown in the UI; steps (`sh`, `junit`, `archiveArtifacts`) are what runs inside it.
- **SCM**: source control. `checkout scm` means "check out whatever repo/branch this job points at".
- **Artifacts**: files a build keeps (here, the `.tgz` package). **JUnit results** give you test reports and trends.
- **JCasC**: Configuration as Code. `jenkins/casc/jenkins.yaml` replaces clicking through the setup wizard.
- **Plugins**: almost every Jenkins feature (Git, pipelines, test reports) is a plugin. They're listed in `jenkins/plugins.txt`.

## Prerequisites (Windows)

1. **Docker Desktop** with the WSL 2 backend, running (whale icon in the tray).
2. **Git for Windows**.
3. A **GitHub repo** containing this folder (Jenkins checks the code out from there).
4. Optional: Node.js 20+ if you want to run the app outside Jenkins.

Commands below work in PowerShell.

## 1. Start Jenkins

```powershell
cd jenkins-practice
copy .env.example .env      # then edit .env and set your own password
docker compose up -d --build
docker compose logs -f jenkins   # wait for "Jenkins is fully up and running", then Ctrl+C
```

Open http://localhost:8080 and log in with the user and password from `.env`. There's no unlock key or setup wizard because JCasC already configured everything.

First build of the image takes a few minutes (it downloads Jenkins, Node and the plugins). After that, `docker compose up -d` is quick.

## 2. Create the pipeline job

1. **New Item** → name it `jenkins-practice` → choose **Pipeline** → OK.
2. Under **Pipeline**, set *Definition* to **Pipeline script from SCM**.
3. *SCM*: **Git**. *Repository URL*: your repo's HTTPS URL, e.g. `https://github.com/lifewithwendy/jenkins-practice.git`.
   - Public repo: no credentials needed.
   - Private repo: add credentials → *Username with password*, username = your GitHub login, password = a GitHub personal access token (not your password).
4. *Branch Specifier*: `*/main`. *Script Path*: `Jenkinsfile`.
5. **Save**, then **Build Now**.

Click the build number → **Console Output** to watch the log, or **Pipeline Overview** / **Stages** to see each stage go green. When it finishes:

- **Tests** shows the 5 JUnit results.
- **Build Artifacts** has `jenkins-practice-app-1.0.0.tgz` to download.

## 3. Trigger builds automatically

GitHub can't reach `localhost`, so webhooks won't work out of the box. Use polling instead:

Job → **Configure** → **Build Triggers** → **Poll SCM** → schedule `H/2 * * * *` (check for new commits every ~2 minutes). Push a commit and watch a build start on its own.

(Later, you can expose Jenkins with a tunnel like ngrok and use a GitHub webhook instead.)

## 4. Exercises

Try these in order; each teaches one thing.

1. **Break a test.** Change `'Hello, world!'` in `app/src/greet.js`, push, and watch the Test stage fail and the JUnit report show which test broke. Fix it.
2. **Add a stage.** Add a `stage('Smoke test')` after Package that starts the server and curls `/health`:
   ```groovy
   sh 'cd app && (node src/server.js & echo $! > pid) && sleep 1 && curl -fsS localhost:3000/health; kill $(cat pid)'
   ```
3. **Parameters.** Add `parameters { booleanParam(name: 'RUN_TESTS', defaultValue: true) }` and wrap the Test stage with `when { expression { params.RUN_TESTS } }`. You'll see **Build with Parameters**.
4. **Multibranch.** Create a **Multibranch Pipeline** job instead, push a feature branch, and see Jenkins build each branch separately.
5. **Change config as code.** Edit `numExecutors` or `systemMessage` in `jenkins/casc/jenkins.yaml`, then **Manage Jenkins → Configuration as Code → Reload existing configuration**.
6. **Add an agent.** Run a second container as an inbound agent, set the controller's executors to 0, and point the pipeline at it with `agent { label 'linux' }`.

## Run the app without Jenkins

```powershell
cd app
npm ci
npm test
npm start   # http://localhost:3000/?name=Wendt and http://localhost:3000/health
```

## Everyday commands

| What | Command |
| --- | --- |
| Stop Jenkins (keeps data) | `docker compose down` |
| Start again | `docker compose up -d` |
| Rebuild after editing Dockerfile or plugins.txt | `docker compose up -d --build` |
| Wipe everything and start fresh | `docker compose down -v` |
| Shell inside the container | `docker exec -it jenkins-practice bash` |

## Troubleshooting

- **HTTP ERROR 431 Request Header Fields Too Large**: your browser is sending lots of `localhost` cookies from other apps. Pull the latest `docker-compose.yml` (it raises the limit) and run `docker compose up -d`, or open http://127.0.0.1:8080 or a private window instead.
- **Port 8080 already in use**: change `"8080:8080"` to `"8081:8080"` in `docker-compose.yml` and open http://localhost:8081 (also update `url` in `jenkins.yaml`).
- **`npm: not found` in the build**: the image wasn't rebuilt. Run `docker compose up -d --build`.
- **Git checkout fails with authentication errors**: the repo is private and the job has no credentials (see step 2.3).
- **Login doesn't work after changing `.env`**: the user is created from `.env` at startup; run `docker compose up -d` again so the new values are applied.

## Defaults chosen

- Node.js app with zero npm dependencies, tested with Node's built-in test runner (output as JUnit XML for Jenkins).
- Builds run on the controller, not separate agents, to keep the first setup to one container.
- "Package" means `npm pack` plus archiving the `.tgz`. Building a Docker image inside Jenkins is a good next step but needs Docker access from the container, which is extra setup on Windows.
- Plugins use `latest`; pin versions once you care about reproducibility.
