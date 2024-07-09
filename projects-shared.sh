allFiles=(
  "package-lock.json"
  "@easy-rtc/core/package.json"
  "@easy-rtc/react/package.json"
  "@easy-rtc/demo-core/package.json"
  "@easy-rtc/demo-react/package.json"
);

checkDiff() {
  for file in ${allFiles[@]}; do
    DIFF=$(git diff $file)

    if [[ $DIFF != "" ]]; then
      echo "Cannot link/unlink with changes in \"$file\""
      exit 1;
    fi
  done
}

discardDiff() {
  for file in ${allFiles[@]}; do
    git checkout $file;
  done
}

installDependency() {
  dependencyMode=$1; # "public" or "local"
  dependencyName=$2;
  project=$3;

  dependency=''
  if [[ $dependencyMode == 'local' ]]; then
    dependency=./$dependencyName
  else
    dependency=$dependencyName@latest
  fi

  echo "Installing $dependency in $project..."
  npm i -S $dependency -w $project
}

installDependencies() {
  dependencyMode=$1; # "public" or "local"

  checkDiff

  rm -rf node_modules;

  installDependency $dependencyMode @easy-rtc/core @easy-rtc/react
  installDependency $dependencyMode @easy-rtc/core @easy-rtc/demo-core
  installDependency $dependencyMode @easy-rtc/react @easy-rtc/demo-react

  npm ci

  echo "Discarding generated workspace changes..."
  discardDiff
}