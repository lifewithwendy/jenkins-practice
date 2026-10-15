# Custom Jenkins controller image:
#   - the official LTS image as a base
#   - Node.js 22 so pipelines can run npm
#   - plugins installed at build time (no clicking through the plugin wizard)
FROM node:22-bookworm-slim AS node

FROM jenkins/jenkins:lts-jdk21

USER root
# Borrow Node.js and npm from the official Node image instead of apt (apt's Node is too old).
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
 && node --version && npm --version
USER jenkins

# Skip the first-run setup wizard; Configuration as Code (casc/jenkins.yaml) sets Jenkins up instead.
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
ENV CASC_JENKINS_CONFIG=/var/jenkins_home/casc/jenkins.yaml

COPY --chown=jenkins:jenkins plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
