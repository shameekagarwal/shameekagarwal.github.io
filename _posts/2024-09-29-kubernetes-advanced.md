---
title: Kubernetes Advanced
---

## Helm

### Getting Started

- docker desktop directly has an option to enable kubernetes. this starts a single node kubernetes cluster when the docker desktop app is started
- point kubectl to the right context - `kubectl config use-context docker-desktop`
- configure autocomplete for kubectl by adding this to ~/.zshrc - `source <(kubectl completion zsh)`
- finally, install helm using `brew install helm`
- we can now run commands like `helm version`, `helm env` to see all the environment variables of helm, etc
- [artifacthub](https://artifacthub.io/) - all cncf related artifacts can be found here, e.g. helm charts
- [bitnami](https://bitnami.com/) - makes it easy to run open source software on supported platforms, e.g. mysql via helm charts

### Repositories

- add a repository - `helm repo add bitnami https://charts.bitnami.com/bitnami`
- the first argument is the desired repo name to use, while the second argument is the url
- list the repositories - `helm repo list`
- search in repositories - `helm search repo nginx`. the output looks as follows - 
  ![](/assets/img/kubernetes-advanced/search-repo.png)
- retrieve all chart versions when searching. (i think it only retrieves latest version by default) - `helm search repo mychart --versions` 
  ![](/assets/img/kubernetes-advanced/search-show-versions.png)
- update repositories with the latest charts - `helm repo update`. can do this before installing a chart to get the latest versions

### Releases

- install a chart - `helm install backend bitnami/nginx`
- the first argument is the desired "release name". the second argument is the name we chose when adding the repo and then the name of the chart
- list the releases - `helm list`
- set the output mode - `helm list --output=json`
- view the created resource using kubectl, e.g. `kubectl get pods` etc
- uninstall the release - `helm uninstall backend`
- note - some commands have "aliases", e.g. if we do `helm uninstall --help`, we can see that `delete` is an alias of uninstall
- upgrade a release - `helm upgrade stacksimplify-mychart stacksimplify/mychart1 --set "image.tag=2.0.0"`
- when we do a `helm list` now, we will see that the revision of the release has been bumped up
  ![](/assets/img/kubernetes-advanced/list-after-upgrade.png)
- view status of a release - `helm status stacksimplify-mychart`
- we can see all the resources for a release using `helm status stacksimplify-mychart --show-resources`
- generate the unique release name automatically - `helm install stacksimplify/mychart1 --generate-name`. on doing `helm list`, we see the release created with name `mychart1-<<some-random-numbers>>`. the same is true for resources created for this release - `helm status mychart1-1727652916 --show-resources`

### Versions

- notice the difference between chart version and app version. this is configured using `version` and `appVersion` inside chart.yaml respectively
- specify the version when installing a chart. if not specified, it defaults to the latest version - `helm install mychart2 stacksimplify/mychart2 --version 0.2.0`
- upgrade to a specific chart version for a release. if not specified, it defaults to the latest version - `helm upgrade mychart2 stacksimplify/mychart2 --version 0.3.0`

### Revisions

- view historical revisions of a release - `helm history stacksimplify-mychart`
- notice how all revisions are in superseded state, but the last one is in deployed state
  ![](/assets/img/kubernetes-advanced/history.png)
- by default, status will of course give the status of the latest revision of the release
- to view the status of a specific revision, use `helm status stacksimplify-mychart --revision 4`
- rollback to the previous revision - `helm rollback mychart2`
- notice the output of `helm history mychart2` on rollback - instead of popping off the last entry, it adds a new entry again
  ![](/assets/img/kubernetes-advanced/rollback-without-revision.png)
- we can also specify the revision to rollback to - `helm rollback mychart2 1`. output of history command is shown again - 
  ![](/assets/img/kubernetes-advanced/rollback-with-revision.png)
- when uninstalling, we can retain the history - `helm uninstall mychart2 --keep-history`
- while `helm list` will be an empty table, `helm history mychart2` will output the following - 
  ![](/assets/img/kubernetes-advanced/uninstall-with-history.png)
- understand that we can now potentially do a `helm rollback mychart2` now to deploy a revision again, which would not have been possible without the keep-history flag
- we can use `helm list --uninstalled` to view the uninstalled releases

### Atomic

- till now, we saw that helm releases can be in states of "superseded" or "deployed". but, the helm release can also be in "failed". the state is failed when some of the resources are not created properly. but, this means other resources are still present, and thus we are in an inconsistent state
- e.g. we try installing the same chart twice. due to collision of port, the node port service could not be created for the second release, but the deployment is still lying around
  ![](/assets/img/kubernetes-advanced/without-atomic.png)
- when we use the atomic flag, a failed release (and all its resources in turn) will be deleted
- `helm install second stacksimplify/mychart1 --atomic`
- `helm list` will not show the second release anymore
- when we pass the atomic flag, bts, wait flag is passed automatically as well, which will wait till all underlying k8s resources are created successfully
- it will wait till the timeout, which can be configured using the timeout flag, which defaults to 5 minutes

### Helm + Namespaces

- during helm install, we can choose the namespace which our resources go into using the namespace flag, and we can also create this namespace if it does not already exist. `helm install dev101 stacksimplify/mychart2 --version=0.1.0 --namespace=dev --create-namespace`
- note that this namespace is not being managed by helm, so uninstalling the helm release will not delete the namespace
- now, for all commands like list, status, etc, we need to append the namespace as well - `helm list --namespace=dev`

### Dry Run and Debug

- dry run - it will for e.g. show us the k8s templates it will generate - `helm install stacksimplify/mychart1 --generate-name --set service.nodePort=31240 --dry-run`
- now, if we add debug to the command above, we also see additional information like the list of computed values etc - `helm install stacksimplify/mychart1 --generate-name --set service.nodePort=31240 --dry-run --debug`
- note - flags like debug are inherited from parent commands, so are available on other commands apart from install as well

### Values

- we can override the values in a chart using the `-f` or `--values` flag
- assume we have a file called myvalues.yaml as shown below. we can tell helm to use this file using `helm upgrade mychart1-1727670747 stacksimplify/mychart1 --values=myvalues.yaml --dry-run --debug`
  ```yaml
  replicaCount: 2
  
  image:
    repository: ghcr.io/stacksimplify/kubenginx
    pullPolicy: IfNotPresent
    tag: "2.0.0"
  
  service:
    type: NodePort
    port: 80
    nodePort: 31250
  ```
- we can get the supplied values for a specific release using `helm get values mychart1-1727670747`
- we can get the supplied values for a specific revision of release as well - `helm get values mychart1-1727670747 --revision=1`
- we can get the generated manifests for a specific release - `helm get manifest mychart1-1727670747`. again, we can specify the revision if we want to
- we can run `helm get all mychart1-1727670747` to get everything - values, hooks, manifests, notes, etc
- priority of values (in increasing order) - 
  - child chart values
  - parent chart values
  - values supplied using `--values` / `-f`
  - values supplied using `--set`
- my understanding - we can delete a value by passing in null from a method higher up in the hierarchy. e.g. we try applying the same chart twice, and it fails because the same port of the node port service is being used. we can change this behavior as follows - `helm install stacksimplify/mychart1 --set service.nodePort=null --generate-name --atomic`

### Basic Chart Structure

- to create a basic chart structure, we can use `helm create sample-chart`. we can see the generated folder structure using `tree sample-chart` - 
  ![](/assets/img/kubernetes-advanced/chart-directory-structure.png)
- .helmignore - patterns to ignore when we generate the helm package
- chart.yaml - metadata about the chart. below is what we typically start with. for additional attributes, refer [documentation](https://helm.sh/docs/topics/charts/#the-chartyaml-file)
  ```yaml
  apiVersion: v2
  name: sample-chart
  description: A Helm chart for Kubernetes
  
  # type can be application or library
  # library charts are included as a dependency
  # they have utilities which application charts can use
  type: application
  
  # chart version
  version: 0.1.0

  # app version - typically the docker image version
  appVersion: "1.16.0"
  ```
- values.yaml - default configuration values
- charts - contains all the charts on which our parent chart depends. we specify these using the dependencies section in chart.yaml. more on this has been discussed later
- templates - contains our templated kubernetes manifests. the manifests are run through a go template rendering engine
- inside this templates folder, anything that begins with an `_` is not considered a kubernetes manifest, e.g. _helpers.tpl. it contains logic that can be reused across the manifests
- finally, we also have a file called notes.txt. this itself is templated as well. it contains information on for e.g. how we can access the application deployed via this chart. the information here is displayed when we for e.g. install a release
- we also have a tests folder inside the templates folder to validate our chart
- finally, the root folder of the chart also contains a readme and a license file

### Root Object

- `.` is the "root object" in helm
- it has several fields like `Values`, `Files`, `Chart`, etc
- to see what is present inside root object, change the contents of notes.txt to the following. using this file is safe because it is not really used, e.g. it is not treated as a manifest and submitted to the kubernetes cluster
  ```
  ((/* display the contents of root object below  */))
  Root Object: (( . ))
  ```
- then, we can try installing the chart in the current directory using dry run to view the render notes - `helm install --generate-name . --dry-run`
  ![](/assets/img/kubernetes-advanced/root-object.png)
- note - when we simply use `.`, it refers to the root object, except when we are inside "with" or "range" blocks
- we can get information about the release - `Name` for e.g. the release name (what we specify when running `helm install release-name repo/chart`). the other attributes are self explanatory. use the same technique of putting the below inside notes to view these values
  ```
  Release Name: (( .Release.Name ))
  Release Revision: (( .Release.Revision ))
  Release Namespace: (( .Release.Namespace ))
  Release IsUpgrade: (( .Release.IsUpgrade ))
  Release IsInstall: (( .Release.IsInstall ))
  Release Service: (( .Release.Service ))
  ```
- similarly, we can use the "chart" object to access any values from the chart.yaml
- "values" object - it just contains the combined contents of values.yaml
- "capabilities" object - provides us with the capabilities of the k8s cluster, e.g. the version of the cluster etc
- "template" object - provides information about the current template. it only has two attributes - 
  ```
  (( .Template ))
  ((/* map[BasePath:sample-chart/templates Name:sample-chart/templates/NOTES.txt] */ ))
  ```
- "files" object can be used to access all non-template special files. e.g. imagine we have a config.toml file in the root as follows - 
  ```
  message1 = "hello world 1"
  message2 = "hello world 2"
  message3 = "hello world 3"
  ```
- both the usage of files.get and its output have been shown below - 
  ```
  config.toml - (( .Files.Get "config.toml" ))
  ((/* config.toml - message1 = "hello world 1" */))
  ((/* message2 = "hello world 2" */))
  ((/* message3 = "hello world 3" */))
  ```
- "glob" will return all the files that match the glob pattern we specify
- "as secrets" will return the contents of the file as base64 encoded, while "as config" will return the contents of the file as yaml
  ```
  glob as secrets - (( (.Files.Glob "config/*").AsSecrets ))
  ((/* glob as secrets - app.toml: bmFtZTogYmFja2VuZAp0eXBlOiBhcHA= */))
  ((/* db.toml: bmFtZT1teXNxbAp0eXBlPWRi */))
  
  glob as config - (( (.Files.Glob "config/*").AsConfig ))
  ((/* glob as config - app.toml: |- */ ))
  ((/*   name: backend */ ))
  ((/*   type: app */ ))
  ((/* db.toml: |- */ ))
  ((/*   name=mysql */ ))
  ((/*   type=db */ ))
  ```
- finally, we can use the "lines" method, which reads and parses the file line by line
  ```
  lines - (( .Files.Lines "config.toml" ))
  ((/* lines - [message1 = "hello world 1" message2 = "hello world 2" message3 = "hello world 3"] /*))
  ```

### Development Basics

- "template action" - `(( ))` is called template action, while anything inside it, e.g. `(( .Chart.Name ))` is called an "action element"
- anything inside template action is rendered by the template engine
- e.g. for the k8s deployment in the manifests folder, we can generate its name as follows - 
  ```yml
  name: (( .Release.Name ))-(( .Chart.Name ))
  ```
- instead of using dry run with install, we can also render charts locally and see the output using the template command - `helm template release-name .`
- we can call the quote function as follows. notice the difference in output with vs without the quotes
  ```yml
  labels:
    kubernetes.io/app: (( .Release.Service ))
    kubernetes.io/app: (( quote .Release.Service ))
  # labels:
  #   app: Helm
  #   app: "Helm"
  ```
- "pipelines" - helps us do several things at once. it is executed from left to right, e.g. 
  ```yml
  kubernetes.io/app: (( .Release.Service | upper | quote | squote ))
  # kubernetes.io/app: '"HELM"'
  ```
- using the "default" function to provide a default value for the replicas incase it is not defined inside values - 
  ```yml
  replicas: (( default 3 .Values.replicas ))
  # helm template backend . | grep replicas
  # replicas: 3
  # helm template backend --set replicas=5 . | grep replicas
  # replicas: 5
  ```
- we can ignore the leading / trailing whitespace by placing a `-` after / before the enclosing brackets of the "template action"
  ```yml
  with_whitespaces: "    (( "helm" ))     "
  without_leading_whitespaces: "    ((- "helm" ))     "
  without_trailing_whitespaces: "    (( "helm" -))     "
  without_whitespaces: "    ((- "helm" -))     "

  # with_whitespaces: "    helm     "
  # without_leading_whitespaces: "helm     "
  # without_trailing_whitespaces: "    helm"
  # without_whitespaces: "helm"
  ```
- note to self, to confirm - in most cases, start by writing template actions as `((-`, not `((` to handle whitespace issues easily
- "indent" can be used to add the specified number of spaces. "nindent" can be used to add the specified number of spaces after a new line
  ```
      indent: (( indent 6 "helm" ))
      indent: (( nindent 6 "helm" ))
  ```
  the output will look as follows - 6 spaces between helm and `indent: ` for the first line, while 6 spaces from the beginning of the line for the second file
  ```
      indent:       helm
      indent: 
        helm
  ```
- `toYaml` - convert an object to yaml. e.g. assume we want to derive the resources required by our pods from values. assume the values.yaml looks as follows - 
  ```yml
  replicas: 3
  
  resources: 
    limits:
      cpu: 100m
      memory: 128Mi
    requests:
      cpu: 100m
      memory: 128Mi
  ```
- we can now use it inside our deployment template like this - 
  ```yml
  resources: (( .Values.resources | toYaml | nindent 10 ))

  # resources: 
  #   limits:
  #     cpu: 100m
  #     memory: 128Mi
  #   requests:
  #     cpu: 100m
  #     memory: 128Mi
  ```
- we can create conditional blocks using if else. "eq" can compare the equality of two arguments
- e.g. assume our values.yaml has the following content - `env: local`
- now, assume the replicas section in our deployment manifest looks as follows - 
  ```yml
  spec:
    replicas:
    ((- if eq .Values.env "prod" )) 4
    ((- else if eq .Values.env "qa" )) 2
    ((- else )) 1
    ((- end ))
  ```
- by default, `helm template .` will show us `replicas: 1`. however, if we run `helm template --set env-prod .`, we see `replicas: 4`
- using boolean conditions - understand that values like true and false provided via values are treated as booleans inside the template actions. values.yaml - 
  ```yml
  env: local
  enableLoadTesting: false
  ```
- deployment.yml - 
  ```yaml
  spec:
    replicas:
    ((- if or (eq .Values.env "prod") (and (eq .Values.env "qa") .Values.enableLoadTesting) )) 4
    ((- else if eq .Values.env "qa" )) 2
    ((- else )) 1
    ((- end ))
  ```
  - `helm template . | grep replicas` - replicas: 1
  - `helm template --set env=qa . | grep replicas` - replicas: 2
  - `helm template --set env=qa,enableLoadTesting=true . | grep replicas` - replicas: 4
  - `helm template --set env=prod . | grep replicas` - replicas: 4
- similarly, we also have `not` function (self explanatory)

### With, Variables and Range

- "with" action - set current context (`.`) to an object
- e.g. imagine we have a values file as follows - 
  ```yml
  annotations:
    name: backend
    type: app
  ```
- now, we can use this in our deployment as follows - notice how we can directly reference the annotations as `.`, because the with block modifies the current context
  ```yml
  template:
    metadata:
      annotations:
        ((- with .Values.annotations ))
          ((- . | toYaml | nindent 8 ))
        ((- end ))
      labels:
        app: nginx
  ```
- if `helm template release_name .` fails, use `helm template release_name . --debug` to see the wrongly generated manifest
- to continue accessing the root object inside the with block, we can use `$` - 
  ```yml
  annotations:
    ((- with .Values.annotations ))
      ((- . | toYaml | nindent 8 ))
    managedBy: (( $.Release.Name ))
    ((- end ))
  ```
- with blocks basically simplify the code by making it smaller and avoiding repetition around accessing objects
- "variables" - again help in simplifying code. first, we assign the variable, and then we show its usage
  ```yml
  ((- $env := .Values.env | lower ))

  replicas:
  ((- if or (eq $env "prod") (and (eq $env "qa") .Values.enableLoadTesting) )) 4
  ((- else if eq $env "qa" )) 2
  ((- else )) 1
  ((- end ))
  ```
- "range" - for each loops. note how the context changes just like when using with
- example 1 - lists. assume our values.yaml file looks like this - 

  ```yml
  environments:
    - name: dev
    - name: qa
    - name: prod
  ```
- we can use this in our manifest as follows - 
  ```yml
  ((- range .Values.environments ))
  apiVersion: v1
  kind: Namespace
  metadata:
    name: (( .name ))
  ---
  ((- end ))
  ```
- we can also assign a variable to use inside ranges as well - 
  ```yml
  ((- range $env := .Values.environments ))
  apiVersion: v1
  kind: Namespace
  metadata:
    name: (( $env.name ))
  ---
  ((- end ))
  ```
- example 2 - dictionaries. assume our values.yaml file looks like this -
  ```yml
  database:
    host: xyz.com
    user: abc
    password: def
  ```
- we can use this in our manifest as follows - 
  ```yml
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: (( .Release.Name ))-(( .Chart.Name ))
  data:
  ((- range $key, $value := .Values.database ))
    ((- $key | nindent 2 )): (( $value ))
  ((- end ))

  # # Source: sample-chart/templates/configmaps.yml
  # apiVersion: v1
  # kind: ConfigMap
  # metadata:
  #   name: app-sample-chart
  # data:
  #   host: xyz.com
  #   password: def
  #   user: abc
  ```

### Named Templates

- recall files in templates starting with `_` are not treated as regular manifests
- these files are used to create "named templates"
- template names are global, so we need to keep them unique
- convention - `<<chart_name>>.<<template_name>>`
  ```yml
  ((- define "helmbasics.app_labels" ))
      app: nginx
  ((- end ))
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    labels:
  ((- template "helmbasics.app_labels" ))
  
  # metadata:
  #   labels:
  #     app: nginx
  ```
- while using a named template, we need to pass it the "context"
- this is what enables the named template to access attributes from this
- look how we pass `.` to the template action call, without that, `.Chart.Name` inside the definition of the named template would not have worked
  ```yml
  ((- define "helmbasics.app_labels" ))
      app: nginx-(( .Chart.Name ))
  ((- end ))
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    labels:
  ((- template "helmbasics.app_labels" . ))

  # metadata:
  #   labels:
  #     app: nginx-sample-chart
  ```
- note - when using the template action to include a template, we cannot for e.g. use `|` for creating "pipelines". to be able to do this, we need to use `include` instead of `template`. basically, the first line below fails, while the second line passes
  ```yml
  ((- template "helmbasics.app_labels" . | upper ))
  ((- include "helmbasics.app_labels" . | upper ))
  ```
- "printf" - helps with string formatting
  ```yml
  ((- define "sample-chart.resource-name" ))
  ((- printf "%s-%s" .Release.Name .Chart.Name ))
  ((- end ))

  name: (( template "sample-chart.resource-name" . ))
  ```
- we can call one named template from another named template. the concepts stay the same

### Package

- packaging a chart - simply do `helm package .`
- packaging with arguments - `helm package sample-chart --destination packages`. we are basically packaging the chart inside folder sample-chart, and moving this packaged tar into the packages folder. the package generated has the name "sample-chart-0.1.0.tgz" i.e. suffixed with the "chart version" (not "app version") i believe
- the idea would be modify the chart version when there are major changes in the chart, and app version when the app itself has changed
- e.g. of installing a release using one of these tar packages - `helm install myappv2 ./packages/sample-chart-2.0.0.tgz --set service.nodePort=31232 --atomic`
- when packaging, we can also specify the version and app version via cli arguments - `helm package sample-chart --version=3.0.0 --app-version=3.0.0 --destination=packages`
- `helm show chart sample-chart` - will show us the contents of our chart.yaml. but it is not that useful here, since we already can see the chart.yaml inside the sample-chart directory. however, this command also works with tarred packages - `helm show chart ./packages/sample-chart-2.0.0.tgz` i.e. we can view the chart.yaml information of tarred packages directly
- along with `chart`, we can use `crds`, `readme`, `values` and `all` with show
- note - `inspect` is an alias of `show`
- remember - there is a `helm get` as well, which is separate from `helm show / inspect`. my understanding of the difference - get works for releases, show / inspect works on charts

### Dependencies

- "dependencies" - method for helm to manage its external dependencies on other charts
- we will now have the parent / main chart at the root, and all child charts would be in the charts/ directory
- this feature helps us manage the deployment of multiple charts as a single unit
- dependencies section in chart.yaml -

  ```yml
  dependencies:
    - name: mychart1
      version: 0.1.0
      repository: https://stacksimplify.github.io/helm-charts/
    - name: mychart2
      version: 0.4.0
      repository: https://stacksimplify.github.io/helm-charts/
    - name: mysql
      version: 11.1.17
      repository: https://charts.bitnami.com/bitnami
  ```
- we can list the dependencies of the current chart using `helm dependency list .`. we see the status as missing because we have not downloaded the charts in the packages directory yet
  ![](/assets/img/kubernetes-advanced/dependency-list.png)
- we can update the dependencies using `helm dependency update .`. on running `helm dependency list .` after this, the status shows up as ok
- we can specify versions in the following ways. note - there are more rules like what if we omit the minor version when using tilde, we can specify placeholders in the form of x, etc. skipping these details for now -
  - using comparison operators - 
    ```yml
    version: "< 9.10.8"
    version: ">= 9.10.8 < 9.11.0"
    ```
  - caret symbol - latest for the same major version. e.g. below is equivalent to >= 9.10.1 and < 10.0.0
    ```yml
    version: "^9.10.1"
    ```
  - tilde symbol - for patch level changes. e.g. below is equivalent to >= 9.10.1, < 9.11.0
    ```yml
    version: "~9.10.1"
    ```
- a chart.lock file is generated for us with the exact versions
- difference between `helm dependency update .` and `helm dependency build .` - update will try using our chart.yaml and bump up the versions in chart.lock, while build will use our chart.lock file as is
- note - i think in case the chart.lock file is missing, both work the same way by generating it for us based on the chart.yaml file
- when we directly change our chart.yaml, if chart.lock does not match with what is there in chart.yaml, we get an error when we try `helm dependency build .`. we are expected to generate chart.lock afresh by running `helm dependency update .`
- if we want to use the same chart more than once, e.g. below, we will get the error "Error: validation: more than one dependency with name or alias "mychart4". so, we need to use "alias" to distinguish them
  
  ```yml
  dependencies:
    - name: mychart4
      version: "0.1.0"
      repository: "https://stacksimplify.github.io/helm-charts/"
      alias: childchart4dev
    - name: mychart4
      version: "0.1.0"
      repository: "https://stacksimplify.github.io/helm-charts/"
      alias: childchart4qa
  ```

### Dependency Conditions / Tags

- we can conditionally disable charts using "condition" - this means the child chart would not be deployed when we do a `helm install`
- by default, chart is enabled i.e. if for e.g. the value is missing, the chart would be treated as enabled. the condition needs to evaluate to false explicitly for the chart to be disabled
  ```yml
  # values.yaml
  mychart4:
    enabled: false
  # OR
  # helm install backend --set mychart4.enabled=false .

  # ...

  - name: mychart4
    version: "0.1.0"
    repository: "https://stacksimplify.github.io/helm-charts/"
    alias: childchart4qa
    condition: mychart4.enabled
  ```
- now, my understanding - we could have named the value anything, say `foo`, and then used `condition: foo`. but, it is convention to name it `chart_name.enabled`
- the disadvantage of the method above - say we have three child charts related to backend. we would have to go and set `chart_name.enabled` as false for all three of them individually in the parent chart
  - theoretically, we could have just had one value called `backend` in the parent chart and set it as false. we could have used the same value in the condition of all the three child backend charts. however, again, helm suggests to only use `chart_name.enabled` for some reason in the condition
- so, helm uses "tags" to address this issue. the chart.yaml looks as follows

  ```yml
  - name: mychart4
    version: "0.1.0"
    repository: "https://stacksimplify.github.io/helm-charts/"
    tags:
      - frontend

  - name: mychart2
    version: "0.4.0"
    repository: "https://stacksimplify.github.io/helm-charts/"
    tags:
      - backend
  ```
- understand how the same tag could have been used by multiple dependencies
- and now, we enable / disable it as follows - 
  ```yml
  tags:
    frontend: false
    backend: false
  ```
- my understanding of how helm dependencies work when providing local path to the actual child chart. assume we have our dependencies section like below - 

  ```yml
  dependencies:
    - name: global-child-chart
      version: "0.1.0"
      repository: "file:///Users/sagarwal/learning/global-child-chart/"
  ```
- now, when we run `helm dependency update .`, helm will automatically create a tar out of this chart and move it to charts directory of parent chart
- the idea is that we can easily make changes to the local chart directly, and we just have perform the dependency update command for the changes to start reflecting in our parent chart

### Overriding Values of Child Charts

- overriding values of child chart from parent chart - we can nest the values under the chart_name key, just like we nested `enabled` above
- e.g. on doing `helm show values charts/mychart2-0.4.0.tgz`, i could see `replicaCount` configured as 1. we can change that as follows - 
  ```yml
  mychart2:
    enabled: true
    replicaCount: 3
  ```
- we can always change the values for child charts, e.g. decrease the count of replicas, and then run `helm upgrade backend . --atomic`, nothing new here
- recall the need for "alias" above - it helps us use the same chart twice. so, we will have to nest `enabled` / override values under alias instead of chart names in such cases
- "global values" - child charts can also access values via global, e.g. `replicas: (( .Values.global.replicaCount ))`, and parent charts can set it as such - 
  ```yml
  global:
    replicaCount: 5
  ```
- use case - if we have multiple child charts charts, the parent chart can control this centrally from one place, and this replica count gets applied to all of them

### Importing Values in Parent Chart

- "explicit imports" - the child chart can export its values as follows - 
  ```yml
  exports:
    mychart1Data:
      mychart1appInfo:
        appName: kapp1
        appType: MicroService
        appDescription: Used for listing products   
  ```
- now, the parent chart can import these values as follows. notice how the key `mychart1Data` is what helps tie the two together

  ```yml
  - name: mychart1
    version: "0.1.0"
    repository: "file://charts/mychart1"
    import-values:
      - mychart1Data
  ```
- finally, the parent chart can start using these imported values now as follows. notice how we do not specify `mychart1Data`, but the keys under it
  ```yml
  (( .Values.mychart1appInfo.appName ))
  ```
- note - if the child chart is enabled, the parent chart cannot import the values
- "implicit imports" - we do not need to export anything from the child chart
- since there might be chances of collision, we might want to access the values of child chart under a different name in the parent chart

  ```yml
  - name: mychart2
    version: "0.4.0"
    repository: "file://charts/mychart2"
    import-values:
      - child: image
        parent: mychart2image
  ```
- finally, the parent chart can start using these imported values as follows. notice how we access it via `mychart2image`
  ```yml
  imageRepository: (( .Values.mychart2image.repository ))
  ```

### Starter Charts

- "starter charts" - they are reusable templates that help us build new charts. this way, new charts need not be created from scratch
- disadvantage of starter chart - since chart.yaml is generated afresh, it does not copy over the dependencies section of the starter chart. we will have to manually add this section
- starter charts are normal charts. we can create them simply using for e.g. `helm create starter-chart`
- after creating the chart, we tune the templates etc to our needs
- then, we can optionally run `helm lint`. it scans our chart for possible issues, and throws an error if the installation will break (e.g. syntactical errors) / warning if the recommendations are not followed
- we need to replace all references to the chart name using `<CHARTNAME>`. e.g. we can find this in chart.yaml under the name attribute, named templates are typically prefixed using chart name, etc
- this ensures that when a chart is created using our starter chart, these references are replaced using our chart name
- when we run `helm env`, we can see the helm data home location - `HELM_DATA_HOME="/Users/sagarwal/Library/helm"`. note - for me, the helm directory does not exist by default. we need to copy the starter folder to the starters directory in this folder. so, i ran `mkdir -p /Users/sagarwal/Library/helm/starters/starter-chart` and then `cp -r . /Users/sagarwal/Library/helm/starters/starter-chart`
- now, we can create a chart using our starter as follows - `helm create backend --starter=starter-chart`
- we see that the chart.yaml has been entirely reset, thus resetting the chart version, app version, and most importantly the dependencies section. so, we need to manually add the dependencies section
- note - manage starters using the [starter plugin](#plugins)

### Plugins

- "plugins" - adds to helm cli
- plugins have flexibility - we can easily write them, and they need not be written in go
- `helm env` tells us the location of plugins - `HELM_PLUGINS="/Users/sagarwal/Library/helm/plugins"`
- use [starter plugin](https://github.com/salesforce/helm-starter) for managing starters easily
- install the plugin using `helm plugin install https://github.com/salesforce/helm-starter.git`
- we typically use a plugin like this - `helm plugin_name command`, e.g. `helm starter --help` in this case
- another useful plugin - [dashboard](https://github.com/komodorio/helm-dashboard) - helps access all helm related stuff using a ui
- install it using `helm plugin install https://github.com/komodorio/helm-dashboard.git`
- we need to run `helm dashboard` in our terminal to access the ui
- it is accessible at [http://localhost:8080/#context=docker-desktop](http://localhost:8080/#context=docker-desktop)
- we can browse through the different releases (installed and uninstalled)
- for each release, we can inspect the different revisions of each release, compare the different revisions of a release, etc
- we can also browse through the different charts offered by the repositories we have added, etc
- note - this tool can also be used by installing a chart instead of using it via a plugin as well i believe

### Hooks

- "chart hooks" - perform some action at certain points during the helm lifecycle, e.g. take a database backup before helm upgrade
- available hooks - 
  - pre-install and post-install
  - pre-upgrade and post-upgrade
  - pre-delete and post-delete (recall delete was an alias for uninstall)
  - pre-rollback and post-rollback
  - test
- how to use hooks - we need to add the following annotation to any k8s object - `"helm.sh/hook": test`, where the value is the hook type. this annotation is what helm uses to identify the kind of hook
- e.g. of pre install pod below. note - remember to keep the restart policy as never, otherwise helm install will hang because the pre install hook container will keep restarting
  ```yml
  apiVersion: v1
  kind: Pod
  metadata: 
    name: pre-install
    annotations:
      "helm.sh/hook": "pre-install"
  spec:
    restartPolicy: Never
    containers:
      - name: pre-install
        image: busybox
        command:  ['sh', '-c', 'echo pre-install hook is running && sleep 15']
  ```
- `kubectl get pods` will show that the hook is in completed state
- so, the kubernetes templates would not be installed until the pre-install hooks are successful. what does successful mean - resources like job / pod should be run to completion, while other resources need to be added / updated i.e. ready
- "hook deletion policy" - helm does not manage the hook resources, e.g. `helm uninstall release` will not delete the hook related resources, it will leave them as is. so, the following hook deletion policies are supported
  - "before-hook-creation" - the default. delete the old resources just before the new resources are created, the next time the hook is run
  - "hook-succeeded" - delete the resource after the hook is successfully executed
  - "hook-failed" - delete the resource if the hook is fails. i would avoid this, as i cannot troubleshoot using kubectl logs etc in case of failures
- we can specify a combination of these policies as well. following is how we specify the deletion policy - `"helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded`
- "hook weights" - if we have multiple hooks, we can specify the order the hooks should be executed in using weights
- default weight is 0
- hooks are executed in increasing order of weights
- "tests" - performed using the test hook
  - ensure that the application is running as expected
- we can run this using `helm test release_name`
- add the annotation `"helm.sh/hook": "test"` for this to work
- e.g. the test hook below tries to query the backend using wget
  ```yml
  apiVersion: v1
  kind: Pod
  metadata: 
    name: test-ping
    annotations:
      "helm.sh/hook": "test"
  spec:
    restartPolicy: Never
    containers:
      - name: test-ping
        image: busybox
        command:  ['sh', '-c', 'wget -qO- {{ include "hooks-demo.backend-name" . }}:80']
  ```
- the output is as follows - "test suite" is the name we gave to the test hook pod
  ![](/assets/img/kubernetes-advanced/test-output.png)

### Resource Policy

- some resources should not be touched once created - not be modified, uninstalled, etc when we run uninstall, upgrade, rollback, etc
- we need to add the annotation `"helm.sh/resource-policy": keep` to such resources
- note - the resource becomes "orphaned", since helm will no longer manage them

### Signing Helm Charts

- helps maintain the integrity of the charts
- when a chart is signed, it comes with a digital signature generated using the private key, while the public key can be used to verify the authenticity of the chart
- first, install gnupg - `brew install gnupg`
- verify the installation using `gpg --version`. it tells us that the keys etc would be stored inside /Users/sagarwal/.gnupg
- use `gpg --full-generate` to create the key
- use type of rsa and rsa, expiry of 0 (never expire), default size of 3072. enter name, email, comment and passphrase of choice
- check the created keys using `gpg --list-keys`
- note - apparently, newer versions of gnupg use kbx, and helm is still using / expecting an older format
- for this, run `gpg --export-secret-keys > ~/.gnupg/secring.gpg` after generating the key, for generating the version of the key compatible with helm
- to generate a signed version of the package, use `helm package . --sign --key helm-demo --keyring ~/.gnupg/secring.gpg --destination=packages` - the key argument is the name we chose when generating the keys, while the keyring is the path to the private key i believe. this command also again prompts us for the passphrase
- now, if we do `ls packages`, we see two files - hooks-demo-1.0.0.tgz and hooks-demo-1.0.0.tgz.prov
- now for verifying, we first need to generate the compatible version of public key as well - `gpg --export > ~/.gnupg/pubring.gpg`
- finally, we can verify the package using `helm verify --keyring ~/.gnupg/pubring.gpg ./packages/hooks-demo-1.0.0.tgz`
- we can also verify packages as part of the helm install command, by passing it `--verify --keyring ...`

### Hosting Charts on Github

- we can host helm charts on github using [chart releaser action](https://github.com/helm/chart-releaser-action)
- it will see if the chart version has changed inside chart.yaml
- it will then generate the packaged artifacts for the chart
- it will then add them to the github releases for the same version as the chart version in chart.yaml
- finally, it will maintain the index.yaml in the gh-pages branch, which contains the urls, that point to our helm packages in the github releases
- this way, we can directly use the github pages url as the url for the helm repo, e.g. `helm repo add helmdemo https://shameekagarwal.github.io/helm-demo/`, and then search for our charts e.g. `helm search repo hooks-demo --versions`

### Validating Values

- we can validate the values.yaml file by defining a [json schema](https://json-schema.org/) inside values.schema.json
- the kind of checks we can perform include 
  - "requirement checks" - declare fields as required, and throw an error if missing
  - "constraint checks" - value should be one of the specified values
  - "type checks" - assert type of value
  - "range validation" - assert on the range of values that can be taken
- refer documentation for [sample schema](https://helm.sh/docs/topics/charts/#schema-files)
- tip - use [this tool](https://onlineyamltools.com/convert-yaml-to-json) to convert yml to json, and then [this tool](https://transform.tools/json-to-json-schema) to convert json to json schema
- commands like lint, template, install, upgrade will fail if the schema validation fails
