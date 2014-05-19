# Build For: Worker, Browser, Node
#
module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    writeBowerJson:
      angular:
        options:
          bowerJsonTemplate: 'etc/bower.json'
          dest: 'build/browser-angular/bower.json'
          data:
            pkg: grunt.file.readJSON 'package.json'
            target: 'angular'
            targetSrc: '1.2.14'
      workular:
        options:
          bowerJsonTemplate: 'etc/bower.json'
          dest: 'build/browser-workular/bower.json'
          data:
            pkg: grunt.file.readJSON 'package.json'
            target: 'workular'
            targetSrc:"git+ssh://dev.higginsregister.com/srv/bower/js-workular.git#v0.5.1"

    insert:
      options: {}
      angular:
        src: 'tmp/intermediate.js'
        dest: 'tmp/angular-shell.js'
        match: '//###RPCCODE'

    mkdir:
      buildEnvironement:
        options:
          create: [
            'tmp',
            'build',
            'build/browser-angular',
            'build/browser-workular',
            'build/node-workular',
            'build/node'
          ]

    jshint:
      all: 'tmp/*.js'

    uglify:
      buildAngular:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-angular/js-rpc.min.map'
        files:
          'build/browser-angular/js-rpc.min.js': ['tmp/angular-shell.js']
      pristine:
        options:
          mangle: false
          compress: false
          beautify: true
          preserveComments: true
        files:
          'build/browser-angular/js-rpc.js': ['tmp/angular-shell  .js']

    concat:
      code:
        src: ['src/simple-fake-promise.js', 'src/remote-procedure.js', 'src/js-rpc.js']
        dest: 'tmp/intermediate.js'
      container:
        src: ['src/angular-shell.js']
        dest: 'tmp/angular-shell.js'


  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-mkdir'
  grunt.loadNpmTasks 'grunt-insert'
  grunt.loadNpmTasks 'grunt-write-bower-json'

  grunt.registerTask('build', ['mkdir', 'concat', 'insert', 'uglify', 'writeBowerJson'])
  grunt.registerTask('default', ['build'])

