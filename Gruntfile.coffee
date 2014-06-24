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
      workularPromise:
        src: 'lib/browser-fake-promise/fake-promise.js'
        dest: 'tmp/workular-shell.js'
        match: '//###FAKEPROMISE'
      workularRPC:
        src: 'tmp/rpc-only.js'
        dest: 'tmp/workular-shell.js'
        match: '//###RPCCODE'
      node:
        src: 'tmp/intermediate.js'
        dest: 'build/node/js-rpc.js'
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

    karma:
      unit:
        configFile: 'etc/karma.conf.js'
        singleRun: true,
        browsers: ['Firefox']

    jshint:
      options:
        sub: true
      all: ['src/angular-rpc-wrapper.js', 'src/js-rpc.js', 'src/remote-procedure.js']

    uglify:
      buildAngular:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-angular/js-rpc.min.map'
        files:
          'build/browser-angular/js-rpc.min.js': ['tmp/angular-shell.js']
      buildWorkular:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-workular/js-rpc.min.map'
        files:
          'build/browser-workular/js-rpc.min.js': ['tmp/workular-shell.js']
      buildWorkularWrap:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-workular/js-rpc-wrapper.min.map'
        files:
          'build/browser-workular/js-rpc.min.js': ['src/workular-rpc-wrapper.js']
      buildAngularWrap:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-angular/js-rpc-wrapper.min.map'
        files:
          'build/browser-workular/js-rpc-wrapper.min.js': ['src/angular-rpc-wrapper.js']
      pristine:
        options:
          mangle: false
          compress: false
          beautify: true
          preserveComments: true
        files:
          'build/browser-angular/js-rpc.js': ['tmp/angular-shell.js']
          'build/browser-workular/js-rpc.js': ['tmp/workular-shell.js']
          'build/browser-workular/js-rpc-wrapper.js': ['src/workular-rpc-wrapper.js']
          'build/browser-angular/js-rpc-wrapper.js': ['src/angular-rpc-wrapper.js']

    concat:
      code:
        src: ['lib/browser-fake-promise/fake-promise.js', 'src/remote-procedure.js', 'src/js-rpc.js']
        dest: 'tmp/intermediate.js'
      rpcOnly:
        src: ['src/remote-procedure.js', 'src/js-rpc.js']
        dest: 'tmp/rpc-only.js'
      containerAngular:
        src: ['src/angular-shell.js']
        dest: 'tmp/angular-shell.js'
      containerNode:
        src: ['src/node-shell.js']
        dest: 'build/node/js-rpc.js'
      containerWorkular:
        src: ['src/workular-shell.js']
        dest: 'tmp/workular-shell.js'


  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-mkdir'
  grunt.loadNpmTasks 'grunt-insert'
  grunt.loadNpmTasks 'grunt-write-bower-json'
  grunt.loadNpmTasks 'grunt-karma'

  grunt.registerTask('build', ['karma', 'mkdir', 'concat', 'insert', 'jshint', 'uglify', 'writeBowerJson'])
  grunt.registerTask('default', ['build'])

