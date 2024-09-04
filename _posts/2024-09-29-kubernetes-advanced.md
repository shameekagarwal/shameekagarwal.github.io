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
  ```txt
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
  ```txt
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
  ```txt
  ((/* display the contents of root object below  */))
  Root Object: (( . ))
  ```
- then, we can try installing the chart in the current directory using dry run to view the render notes - `helm install --generate-name . --dry-run`
  ![](/assets/img/kubernetes-advanced/root-object.png)
- note - when we simply use `.`, it refers to the root object, except when we are inside "with" or "range" blocks
- we can get information about the release - `Name` for e.g. the release name (what we specify when running `helm install release-name repo/chart`). the other attributes are self explanatory. use the same technique of putting the below inside notes to view these values
  ```txt
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
  ```txt
  (( .Template ))
  ((/* map[BasePath:sample-chart/templates Name:sample-chart/templates/NOTES.txt] */ ))
  ```
- "files" object can be used to access all non-template special files. e.g. imagine we have a config.toml file in the root as follows - 
  ```txt
  message1 = "hello world 1"
  message2 = "hello world 2"
  message3 = "hello world 3"
  ```
- both the usage of files.get and its output have been shown below - 
  ```txt
  config.toml - (( .Files.Get "config.toml" ))
  ((/* config.toml - message1 = "hello world 1" */))
  ((/* message2 = "hello world 2" */))
  ((/* message3 = "hello world 3" */))
  ```
- "glob" will return all the files that match the glob pattern we specify
- "as secrets" will return the contents of the file as base64 encoded, while "as config" will return the contents of the file as yaml
  ```txt
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
  ```txt
  lines - (( .Files.Lines "config.toml" ))
  ((/* lines - [message1 = "hello world 1" message2 = "hello world 2" message3 = "hello world 3"] /*))
  ```

### Development Basics

- "template action" - `(( ))` is called template action, while anything inside it, e.g. `(( .Chart.Name ))` is called an "action element"
- anything inside template action is rendered by the template engine
- e.g. for the k8s deployment in the manifests folder, we can generate its name as follows - 
  ```txt
  name: (( .Release.Name ))-(( .Chart.Name ))
  ```
- instead of using dry run with install, we can also render charts locally and see the output using the template command - `helm template release-name .`
- we can call the quote function as follows. notice the difference in output with vs without the quotes
  ```txt
  labels:
    kubernetes.io/app: (( .Release.Service ))
    kubernetes.io/app: (( quote .Release.Service ))
  # labels:
  #   app: Helm
  #   app: "Helm"
  ```
- "pipelines" - helps us do several things at once. it is executed from left to right, e.g. 
  ```txt
  kubernetes.io/app: (( .Release.Service | upper | quote | squote ))
  # kubernetes.io/app: '"HELM"'
  ```
- using the "default" function to provide a default value for the replicas incase it is not defined inside values - 
  ```txt
  replicas: (( default 3 .Values.replicas ))
  # helm template backend . | grep replicas
  # replicas: 3
  # helm template backend --set replicas=5 . | grep replicas
  # replicas: 5
  ```
- we can ignore the leading / trailing whitespace by placing a `-` after / before the enclosing brackets of the "template action"
  ```txt
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
  ```txt
      indent: (( indent 6 "helm" ))
      indent: (( nindent 6 "helm" ))
  ```
  the output will look as follows - 6 spaces between helm and `indent: ` for the first line, while 6 spaces from the beginning of the line for the second file
  ```txt
      indent:       helm
      indent: 
        helm
  ```
- `toYaml` - convert an object to yaml. e.g. assume we want to derive the resources required by our pods from values. assume the values.yaml looks as follows - 
  ```txt
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
  ```txt
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
  ```txt
  spec:
    replicas:
    ((- if eq .Values.env "prod" )) 4
    ((- else if eq .Values.env "qa" )) 2
    ((- else )) 1
    ((- end ))
  ```
- by default, `helm template .` will show us `replicas: 1`. however, if we run `helm template --set env-prod .`, we see `replicas: 4`
- using boolean conditions - understand that values like true and false provided via values are treated as booleans inside the template actions. values.yaml - 
  ```txt
  env: local
  enableLoadTesting: false
  ```
- deployment.yml - 
  ```txt
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
  ```txt
  annotations:
    name: backend
    type: app
  ```
- now, we can use this in our deployment as follows - notice how we can directly reference the annotations as `.`, because the with block modifies the current context
  ```txt
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
  ```txt
  annotations:
    ((- with .Values.annotations ))
      ((- . | toYaml | nindent 8 ))
    managedBy: (( $.Release.Name ))
    ((- end ))
  ```
- with blocks basically simplify the code by making it smaller and avoiding repetition around accessing objects
- "variables" - again help in simplifying code. first, we assign the variable, and then we show its usage
  ```txt
  ((- $env := .Values.env | lower ))

  replicas:
  ((- if or (eq $env "prod") (and (eq $env "qa") .Values.enableLoadTesting) )) 4
  ((- else if eq $env "qa" )) 2
  ((- else )) 1
  ((- end ))
  ```
- "range" - for each loops. note how the context changes just like when using with
- example 1 - lists. assume our values.yaml file looks like this - 

  ```txt
  environments:
    - name: dev
    - name: qa
    - name: prod
  ```
- we can use this in our manifest as follows - 
  ```txt
  ((- range .Values.environments ))
  apiVersion: v1
  kind: Namespace
  metadata:
    name: (( .name ))
  ---
  ((- end ))
  ```
- we can also assign a variable to use inside ranges as well - 
  ```txt
  ((- range $env := .Values.environments ))
  apiVersion: v1
  kind: Namespace
  metadata:
    name: (( $env.name ))
  ---
  ((- end ))
  ```
- example 2 - dictionaries. assume our values.yaml file looks like this -
  ```txt
  database:
    host: xyz.com
    user: abc
    password: def
  ```
- we can use this in our manifest as follows - 
  ```txt
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
  ```txt
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
  ```txt
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
  ```txt
  ((- template "helmbasics.app_labels" . | upper ))
  ((- include "helmbasics.app_labels" . | upper ))
  ```
- "printf" - helps with string formatting
  ```txt
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

  ```txt
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
    ```txt
    version: "< 9.10.8"
    version: ">= 9.10.8 < 9.11.0"
    ```
  - caret symbol - latest for the same major version. e.g. below is equivalent to >= 9.10.1 and < 10.0.0
    ```txt
    version: "^9.10.1"
    ```
  - tilde symbol - for patch level changes. e.g. below is equivalent to >= 9.10.1, < 9.11.0
    ```txt
    version: "~9.10.1"
    ```
- a chart.lock file is generated for us with the exact versions
- difference between `helm dependency update .` and `helm dependency build .` - update will try using our chart.yaml and bump up the versions in chart.lock, while build will use our chart.lock file as is
- note - i think in case the chart.lock file is missing, both work the same way by generating it for us based on the chart.yaml file
- when we directly change our chart.yaml, if chart.lock does not match with what is there in chart.yaml, we get an error when we try `helm dependency build .`. we are expected to generate chart.lock afresh by running `helm dependency update .`
- if we want to use the same chart more than once, e.g. below, we will get the error "Error: validation: more than one dependency with name or alias "mychart4". so, we need to use "alias" to distinguish them
  
  ```txt
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
  ```txt
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

  ```txt
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
  ```txt
  tags:
    frontend: false
    backend: false
  ```
- my understanding of how helm dependencies work when providing local path to the actual child chart. assume we have our dependencies section like below - 

  ```txt
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
  ```txt
  mychart2:
    enabled: true
    replicaCount: 3
  ```
- we can always change the values for child charts, e.g. decrease the count of replicas, and then run `helm upgrade backend . --atomic`, nothing new here
- recall the need for "alias" above - it helps us use the same chart twice. so, we will have to nest `enabled` / override values under alias instead of chart names in such cases
- "global values" - child charts can also access values via global, e.g. `replicas: (( .Values.global.replicaCount ))`, and parent charts can set it as such - 
  ```txt
  global:
    replicaCount: 5
  ```
- use case - if we have multiple child charts charts, the parent chart can control this centrally from one place, and this replica count gets applied to all of them

### Importing Values in Parent Chart

- "explicit imports" - the child chart can export its values as follows - 
  ```txt
  exports:
    mychart1Data:
      mychart1appInfo:
        appName: kapp1
        appType: MicroService
        appDescription: Used for listing products   
  ```
- now, the parent chart can import these values as follows. notice how the key `mychart1Data` is what helps tie the two together

  ```txt
  - name: mychart1
    version: "0.1.0"
    repository: "file://charts/mychart1"
    import-values:
      - mychart1Data
  ```
- finally, the parent chart can start using these imported values now as follows. notice how we do not specify `mychart1Data`, but the keys under it
  ```txt
  (( .Values.mychart1appInfo.appName ))
  ```
- note - if the child chart is enabled, the parent chart cannot import the values
- "implicit imports" - we do not need to export anything from the child chart
- since there might be chances of collision, we might want to access the values of child chart under a different name in the parent chart

  ```txt
  - name: mychart2
    version: "0.4.0"
    repository: "file://charts/mychart2"
    import-values:
      - child: image
        parent: mychart2image
  ```
- finally, the parent chart can start using these imported values as follows. notice how we access it via `mychart2image`
  ```txt
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
  ```txt
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
  ```txt
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
        command:  ['sh', '-c', 'wget -qO- (( include "hooks-demo.backend-name" . )):80']
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

## Istio

### Getting Started

- istio injects its own proxy container into every pod like a sidecar
- the service calls are now routed via this proxy container - the proxy container in the source pod now calls the proxy container in the target pod
- finally, there are different istio related pods running in the istio-system namespace. specifically, a pod called istiod (istio daemon) running in this namespace implements the core logic of istio. note - apparently, earlier versions of istio had distributed its logic into a lot more pods, but now, a lot of it has been aggregated into this one istiod pod
- istio calls the layer running the proxy pods as "data plane", while the layer running the pods in the istio-system namespace as "control plane"
  ![](/assets/img/kubernetes-advanced/istio-architecture.svg)
- first, we need to add istio to our cluster
- istio comes with its own crd (custom resource definition)
- we need to add this label to all namespaces in which we would like to have istio's functionality - `istio-injection=enabled`. this label helps inject the sidecar proxy to the pods for us automatically, and this way, we do not have to change our existing manifests
- now, when we run `kubectl get pods`, we see that all our pods have an extra container being spun up called "istio-proxy"
- istio uses [envoy](https://www.envoyproxy.io/) underneath
- we work with the crd of istio, and it takes care of configuring and managing envoy for us

### Telemetry - Kiali

- istio comes with three user interfaces - kiali, jaeger and grafana
- we can see the kiali service as follows - `kubectl get service --namespace istio-system | grep kiali`, and then access it at its nodeport
- kiali is "a console for the istio service mesh"
- in kiali, we can choose the type of graph we would like to see. e.g. service graph will show us the interactions between all the kubernetes services
- a grey line between the services in this service graph indicates that there has been no traffic between the services during the period we have selected, e.g. below, while fleetman-api-gateway does make calls to fleetman-staff-service, there have not been any calls in the last minute. in fact, if there is no traffic between them for a considerable amount of time, that line would be removed entirely from the graph eventually. this means that the graphs are dynamic and change based on traffic
  ![](/assets/img/kubernetes-advanced/kiali-service-graph.png)
- there are 3 options at the bottom to lay out the graph in different styles. the graphs stay the same, its just the orientation of the edges and nodes that change (bottom left, notice the three buttons on the left of "legend" in the image above)
- we can select the namespaces for which we would like to view the graph (top left dropdown in the image above)
- if we double click on a service, we see the graph related to that service only
  ![](/assets/img/kubernetes-advanced/kiali-select-service.png)
- till now, we saw the service graph, which i believe showed us the kubernetes services
- we can also view the workload graph, which shows us the workloads and the services. kiali calls the pods / deployments as workloads
  ![](/assets/img/kubernetes-advanced/kiali-workload-graph.png)
- as we can see, the graph shows both the workloads (circles) and the services (triangles). use the "legend" button on the bottom left to see what shape represents what
- we can opt in to see only the workloads, and uncheck the services using the display dropdown on the top left
- unlike service graph, the workload graph can also show us the average response time on the edges, which we can opt in to see by checking this option in the display dropdown
- be it the service or the workload graph, we can see details about the underlying pod / service, some metrics about inbound / outbound traffic like response times and sizes, etc. to do this, click on the node, and on the right pane, click the three dots at the top and hit "show details"
  ![](/assets/img/kubernetes-advanced/kiali-workload-details.png)
- we can select the "traffic animation" option from the display dropdown. it will show us animation around the flow of traffic using moving circles on the edges. the circles will be more in number depending on the number of requests, and the circles would be larger / smaller depending on the size of the payloads
- we can also change some istio configuration using the kiali user interface. e.g. after going into the details for a service as described earlier, we can click the "actions" dropdown and then for e.g. click on suspend traffic. bts, it will create the virtual services and destination rules for istio automatically for us. we can click on "istio config" from the left side main navigation and see the same
  ![](/assets/img/kubernetes-advanced/kiali-suspend-traffic.png)
- while we would love to track everything using iac and yaml, this technique of doing things via the ui can serve as a hotfix during production issues
- to delete all of this, we can now click on "delete all traffic routing" from the same actions dropdown (look at the dropdown options in the image above)
- for kiali to be able to identify our different applications effectively, we need to add the label of `app` to our pods. then, kiali can identify our applications using the value we set for this label
- `version` is another useful label we can add to our pods to make the kiali ui appear better
- we use both these labels to manage [canary releases](#traffic-management) effectively
- kiali can also do validations for us i.e. spot errors in our istio configuration. e.g. if we make a typo in the service name, we would be able to run kubectl apply successfully, because it is syntactically valid, but kiali will identify and flag this for us, visible in the istio config tab

### Telemetry - Jaeger

- kiali does not give us details about the individual requests, which is why we need a distributed tracing framework like jaeger
- distributed tracing - shows us the entire path taken by a request across the various components, how much time was spent in each part, etc
- istio has support for both jaeger and zipkin. note - this statement might predate opentelemetry
- what the "waterfall model" looks like in jaeger - e.g. service a calls service b, which in turn calls service c
  - we will see a long bar for service a. it represents the time spent in processing the request by service a and the time taken by service b
  - we will see a part of the bar for service b. it again represents the time spent in processing the request by service b and the time taken by service c
  - and this continues depending on how many nested calls are there
- the entire graph is called a "trace", while each individual bar is called a "span"
- note about istio - we might see additional bars in the trace, because of the additional requests between the application container and the sidecar envoy proxy
- we need to select a service from the jaeger ui dropdown to be able to see the traces. by selecting a service, we essentially say "show me all traces that this service is a part of", and not necessarily "show me all traces that start from this service"
- the graph on top shows us the time taken by requests end to end. here, we can click on circles that are "outliers" i.e. took a long time and inspect that particular trace
  ![](/assets/img/kubernetes-advanced/jaeger-ui-graph.png)
- there is a "lookback" dropdown on the right panel, where we can either select last 1 hour, last 2 hours, etc, or we can select "custom time range" in this dropdown. upon selecting this option, we see two additional inputs pop up, which allows us to set a custom start and end time
- if we inspect the tags for any span, we see a tag called `guid:x-request-id`. it is a random guid that contains the same value for all spans in a trace
- for tracing to work end to end properly, our applications need to ensure that this header / trace context is propagated properly. otherwise, our traces would not be stitched properly. the why behind this - 
  - assume the following scenario - service a -> service b -> service c
  - now, detailed flow - ... service b proxy -> service b app -> service b proxy -> service c proxy ...
  - now, when service b calls service c, service b proxy has no way of knowing that the request made by service b app is a part of the request from service a and not just an adhoc request, unless service b app uses the same guid when making this request
- unlike most other features of istio, getting distributed tracing to work is invasive i.e. it requires changes in our application logic

### Traffic Management

- "canary releases" - deploy the new version of the software alongside the old version. only a small percentage of the requests are directed to the new version, and most of the remaining requests are directed to the old version
- it is typically used when we have a lot of users, because this way, if there is an issue with the newer version, only a small portion of our users will face the issue
- synonym - "staged releases"
- a cheap way of implementing canaries using just kubernetes - 
  - have two deployments - say service-new and service. service-new points to the newer image, while service to the original, older image
  - ensure that the pod template for both has the same labels
  - create one service with the same selector labels as well. this way, this service can direct the traffic to pods of either of the deployments
  - now, say we run 3 replicas of service, and 1 replica of service-new. this way, we ensure that only 25% of the traffic reaches the newer version of the app
- now, to configure canaries in istio, first, we need to create two different deployments, just like we saw above
- however, unlike above, we do not need to adjust the number of replicas to achieve the weighted routing
- i think typically, we use the `app` label which is set to the same value in both deployments, and `version` label which is set to a different value in both deployments. even the kiali ui understands these two labels
  ```txt
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: staff-service-risky
  spec:
    selector:
      matchLabels:
        app: staff-service
    replicas: 1
    template:
      metadata:
        labels:
          app: staff-service
          version: risky
      spec:
        containers:
        - name: staff-service
          image: richardchesterwood/istio-fleetman-staff-service:6-arm64
  ---
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: staff-service
  spec:
    selector:
      matchLabels:
        app: staff-service
    replicas: 1
    template:
      metadata:
        labels:
          app: staff-service
          version: stable
      spec:
        containers:
        - name: staff-service
          image: richardchesterwood/istio-fleetman-staff-service:6-placeholder-arm64
  ```
- the k8s service implements service discovery by selecting all the pods across both deployments, by only specifying the common `app` label
  ```txt
  apiVersion: v1
  kind: Service
  metadata:
    name: fleetman-staff-service
  spec:
    selector:
      app: staff-service
    ports:
      - name: http
        port: 8080
    type: ClusterIP
  ```
- now, we need to configure "virtual services" and "destination rules"
- these configs are basically saved in istiod / used to configure the proxy sidecars
- by default, a k8s service would redirect to the pods using something like round robin, and we cannot control this. but using istio, we can control this behavior now
- an example configuration of a virtual service - 
  - host - the address used by client to connect to the service
  - destination - where to route the traffic to
  - the subset under destination comes from the destination rules
  - to avoid misconfigurations, remember to add the namespace of the service to the service name
 
  ```txt
  apiVersion: networking.istio.io/v1beta1
  kind: VirtualService
  metadata:
    name: fleetman-staff-service
  spec:
    hosts:
      - fleetman-staff-service.default
    http:
      - route:
        - destination:
            host: fleetman-staff-service.default
            subset: stable
          weight: 90
        - destination:
            host: fleetman-staff-service.default
            subset: risky
          weight: 10
  ```
- an example configuration of a destination rule -
  - host points to the target service, which was destination.host inside virtual service
  - using destination, we are defining which pods are part of which subset. note how this works just like selectors of k8s services. we are using the label `version` for this, which had different values for the different canaries
  - we are also giving a name to these subsets that we create, which is used in the virtual service

  ```txt
  apiVersion: networking.istio.io/v1beta1
  kind: DestinationRule
  metadata:
    name: fleetman-staff-service
  spec:
    host: fleetman-staff-service.default
    subsets:
      - name: stable
        labels:
          version: stable
      - name: risky
        labels:
          version: risky
  ```
- remember - it might feel that destination rule and virtual services come in pairs i.e. we need to have both at a time, but that is not the case. e.g. if we do not need to add the `subset` field in virtual service and simply direct to a specific k8s service, we can omit the destination rule config altogether
- finally, we could have done all this using the ui as well. recall how we used to reach the detail view of a service. from the action dropdown, select "create weighted routing", and now, we can see sliders which we can drag to adjust the weights. this will automatically generate the destination rule and virtual service for us
  ![](/assets/img/kubernetes-advanced/istio-weighted-routing.png)
- canary releases are best visualized using the "versioned app graph" type of visualization. recall how we had seen service and workload graphs till now. i think this is possible because of the labels `app` and `version`
  ![](/assets/img/kubernetes-advanced/traffic-mgmt-versioned-app-graph.png)

### Load Balancing

- one disadvantage of the solution above - the same user might be potentially seeing different versions of the application, if they make multiple calls
- this might lead to an inconsistent experience
- so, we might want to introduce stickiness to our solution
- note - unfortunately, as it stands, in istio, stickiness and weighted routing do not work together, so we need to get rid of weighted routing for stickiness to work
- we can use one of the three - a cookie, some request header or the source ip, and generate a "consistent hash" for it. this then gets used by the proxy to ensure that the request from the same user reaches the same pod every time
- since this would not work with weighting, we just need one subset in the destination rule / one destination in the virtual service, and so, we use the `app` label inside the destination rule
  ```txt
  kind: VirtualService
  apiVersion: networking.istio.io/v1alpha3
  metadata:
    name: fleetman-staff-service
  spec:
    hosts:
      - fleetman-staff-service.default
    http:
      - route:
          - destination:
              host: fleetman-staff-service.default
              subset: all-staff-service-pods
  ---
  kind: DestinationRule
  apiVersion: networking.istio.io/v1alpha3
  metadata:
    name: fleetman-staff-service
  spec:
    host: fleetman-staff-service.default
    trafficPolicy:
      loadBalancer:
        consistentHash:
          httpHeaderName: "x-myval"
    subsets:
      - name: all-staff-service-pods
        labels:
          app: staff-service
  ```

### Gateways

- till now, our [canary release implementation using istio](#traffic-management) worked because basically, it was an intra cluster communication, which meant when service a called service b, it went via the proxy of service a, and thus istio specific routing logic could be configured and injected
- this is not true if for e.g. we were accessing a pod from outside the cluster, say using an exposed node port. the envoy proxy is not getting a chance to intercept our traffic in this case
- so, we need "gateways", that do exactly this - configure the envoy proxy at the edge
- there is a deployment called `istio-ingressgateway` and a node port service called `istio-ingressgateway` as well running inside the istio-system namespace
- we can see that the node port service exposes port 31380 of the worker nodes
- an example configuration of a gateway object -
  - port - we need to configure this istio ingress gateway pod now to listen on port 80, since the default is to deny all traffic
  - selector - this gateway configuration gets applied to the right istio ingress gateway pods. the istio ingress gateway pods have this label as well
  - hosts - address used by the client, like in virtual service. it would ideally be configured for specific domains in production, but for now, we are setting it to `*`. this way, the ingress gateway pod would only listen on the port if the traffic is coming using the specified domain

  ```txt
  apiVersion: networking.istio.io/v1
  kind: Gateway
  metadata:
    name: ingress-gateway
  spec:
    selector:
      istio: ingressgateway
    servers:
    - port:
        number: 80
        name: http
        protocol: HTTP
      hosts:
        - "*"
  ```
- an example configuration of a virtual service - 
  - gateway - the virtual routing applies to all the gateways specified in this list
  - host - the address used by client to connect to the service. since we used `*` in the gateway object, we use `*` here as well. recall it was just the service name during [intra cluster communication](#traffic-management)

  ```txt
  kind: VirtualService
  apiVersion: networking.istio.io/v1alpha3
  metadata:
    name: fleetman-webapp
  spec:
    hosts:
      - "*"
    gateways:
      - ingress-gateway
    http:
      - route:
          - destination:
              host: fleetman-webapp.default
              subset: original
            weight: 90
          - destination:
              host: fleetman-webapp.default
              subset: experimental
            weight: 10
  ```
- we only talk about configuring the gateway and virtual service in this section, because the destination rule configuration stays the same

### Prefix and Domain Based Routing

- till now, we saw how we can use canaries for calls from outside the cluster using ingress gateway. but, we can also do prefix based routing, e.g. redirect to the normal app for the root url, but redirect to the experimental version of the app when the path is /experimental or /canary. notice how we can skip the weight argument too when there is only one element in the route array
  ```txt
  kind: VirtualService
  apiVersion: networking.istio.io/v1alpha3
  metadata:
    name: fleetman-webapp
  spec:
    hosts:
      - "*"
    gateways:
      - ingress-gateway
    http:
      - match:
          - uri: { prefix: /experimental }
          - uri: { prefix: /canary }
        route:
          - destination:
              host: fleetman-webapp.default.svc.cluster.local
              subset: experimental
      - match:
          - uri: { prefix: / }
        route:
          - destination:
              host: fleetman-webapp.default.svc.cluster.local
              subset: original
  ```
- apart from prefix, we can also use `exact` or `regex`, enable case insensitive, match based on scheme (http / https) or request method, query parameters, etc
- issue with prefix routing - the application has to support it. the application might break if it is sensitive to these paths. solution - use subdomain routing instead
- for testing this locally, add the following entry to /etc/hosts - 
  ```txt
  127.0.0.1	fleetman.com
  127.0.0.1	experimental.fleetman.com
  ```
- first, the gateway needs to allow listening for both these domains. notice how we configure the hosts section of our gateway object to allow for all subdomains of fleetman.com and fleetman.com by itself - 
  ```txt
  apiVersion: networking.istio.io/v1alpha3
  kind: Gateway
  metadata:
    name: ingress-gateway-configuration
  spec:
    selector:
      istio: ingressgateway
    servers:
      - port:
          number: 80
          name: http
          protocol: HTTP
        hosts:
          - "*.fleetman.com"
          - "fleetman.com"
  ```
- now, we need a different virtual service for every domain (notice the hosts key of the two virtual services below). each of them can handle routing in their own way

  ```txt
  kind: VirtualService
  apiVersion: networking.istio.io/v1alpha3
  metadata:
    name: fleetman-webapp
    namespace: default
  spec:
    hosts:
      - "fleetman.com"
    gateways:
      - ingress-gateway-configuration
    http:
      - route:
        - destination:
            host: fleetman-webapp
            subset: original
  ---
  kind: VirtualService
  apiVersion: networking.istio.io/v1alpha3
  metadata:
    name: fleetman-webapp-experiment
    namespace: default
  spec:
    hosts:
      - "experimental.fleetman.com"
    gateways:
      - ingress-gateway-configuration
    http:
        - route:
          - destination:
              host: fleetman-webapp
              subset: experimental
  ```

### Dark Releases

- we already saw matching based on [prefix and domain based routing](#prefix-and-domain-based-routing). now, we will see routing based on headers - 
  ```txt
  kind: VirtualService
  apiVersion: networking.istio.io/v1alpha3
  metadata:
    name: fleetman-webapp
    namespace: default
  spec:
    hosts:
      - "*"
    gateways:
      - ingress-gateway-configuration
    http:
      - match:
        - headers:
            my-header:
              exact: canary
        route:
        - destination:
            host: fleetman-webapp
            subset: experimental
      - route:
        - destination:
            host: fleetman-webapp
            subset: original
  ```
- the second element in our routes section does not have any `match` element, and hence it behaves like a catch all entry
- using this, we can perform "dark releases". we can have parts of our services running two versions - new, untested versions and the older, stable versions
- i am using the chrome extension [mod header](https://chromewebstore.google.com/detail/modheader-modify-http-hea/idgpnmonknjnojddfkpgkljpfnnfcklj) to add header to outgoing requests easily. i added two profiles here - one that adds the canary header and one that does not
- this way, only users (e.g. developers of our company) can now see and interact with the new version, and our customers continue being served by the older stable version. and all of this is happening inside the production cluster directly, thus helping us save on resources
- remember about header propagation - we might want to be several services deep when using istio, e.g. service a canary -> service b -> service c -> service d canary. this means the canary header(s) need to propagated all the way, so that we can easily use canary version of some services

### Fault Injection

- we want to design our systems such that even if a service goes down, our system continues to work, albeit in a degraded way
- option 1, naive - create a version of deployment with random failures
- option 2 - use istio
- using istio, we can do things like return random failures, return responses after some delay, etc. we can also set the percentage of requests for which we would like these faults kick in
- and remember, thanks to istio, we can set these faults only for a subset of pods. e.g. refer the yml below, the risky / canary version is the only one where we see a degraded performance
  ```txt
  kind: VirtualService
  apiVersion: networking.istio.io/v1alpha3
  metadata:
    name: fleetman-staff-service
    namespace: default
  spec:
    hosts:
      - fleetman-staff-service
    http:
      - match:
          - headers:
              x-my-header:
                exact: canary
        fault:
          abort:
            percentage:
              value: 100.0
            httpStatus: 418
        route:
          - destination:
              host: fleetman-staff-service
              subset: risky
      - route:
          - destination:
              host: fleetman-staff-service
              subset: safe
  ```
- we might want to look tools that do chaos engineering for more advanced capabilities

### Circuit Breaker

- read about circuit breakers [here](/posts/high-level-design/#circuit-breaker-pattern)
- a popular library used for this is hystrix. issues with libraries like hystrix - we need to bake as a part of the code. thus, all languages would have to support this as well
- the istio proxy sidecars have circuit breakers built in, and thus we do not have to touch the microservice code
- circuit breakers in istio work at a pod level, not service level
- assume a particular pod has returned 3 consecutive 503s. the proxy will now stop routing traffic to this pod. it will however continue sending traffic to the other pods of this deployment. after some time, it will again start sending requests to the pod that was failing
- understand that the pod still stays in the cluster, it is not evicted. it is given some time to settle down, and requests are directed to it again
- my understanding - this is an important understanding about istio - by default, k8s services are not intelligent, and do plain round robin like balancing between the pods, but istio can do intelligent routing on top of this, which gives us all these features around dark releases, canary releases, and now circuit breaking
- istio calls circuit breaking as "outlier detection"
- to enable circuit breaking, just supply `outlierDetection`, and the default values would kick in
- example configuration - we apply the configuration via a destination rule only, and we do not need a virtual service
  - `consecutive5xxErrors` or `consecutiveGatewayErrors` - both are the same, just that the gateway version is switched on only for 502, 503 and 504
  - `interval` - if there are x or more errors in the interval supplied here, the circuit breaker logic kicks in. x here refers to the number specified above
  - `baseEjectionTime` - if the pod is evicted the first time, it will stay evicted for the duration specified here. the next time, it would be ejected for a duration of 2 * this duration and so on. so, its almost like we can configure exponential backoff strategy using this
  - `maxEjectionPercent` - by default, at least one pod would be ejected due to circuit breaking logic, but at max, this percentage of pods would be evicted. defaults to 10%. note to self - maybe 100% is a better default? otherwise, we might be back to the cascading failures problem
- understand how while we apply the configuration to a whole k8s service using the `host` key, it actually monitors on a pod by pod basis
