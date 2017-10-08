module.exports = function (grunt) {

    grunt.initConfig({
        shell: {
            command: `tsc -p src`,
            options: {
                failOnError: false
            }
        },
        babel: {
            source: {
                options: {
                    sourceMap: false,
                    presets: ["es2015"],
                },
                files: [{
                    expand: true,
                    cwd: `out/es6`,
                    src: [`**/*.js`],
                    dest: `out/es5`
                }]
            }
        },

        // 通过connect任务，创建一个静态服务器
        connect: {
            www: {
                options: {
                    // 服务器端口号
                    port: 8029,
                    // 服务器地址(可以使用主机名localhost，也能使用IP)
                    hostname: '192.168.1.9',
                    // keepalive: true,
                    livereload: 35729,
                    // 物理路径(默认为. 即根目录) 注：使用'.'或'..'为路径的时，可能会返回403 Forbidden. 此时将该值改为相对路径 如：/grunt/reloard。
                    base: 'out/www',
                    //open: true,
                    // protocol: 'https',
                    key: grunt.file.read('cert/server_nopwd.key').toString(),
                    cert: grunt.file.read('cert/server.crt').toString(),
                    ca: grunt.file.read('cert/server.csr').toString()
                }
            }
        },
        copy: {
            js_es6: {
                files: [{
                    expand: true,
                    cwd: `src/js/es6`,
                    src: [`**/*.js`],
                    dest: `out/es6/js`
                }]
            },
            source: {
                files: [{
                        expand: true,
                        cwd: `src/js`,
                        src: `*.js`,
                        dest: `out/es5/js`
                    },
                    {
                        expand: true,
                        cwd: `src/`,
                        src: `*.html`,
                        dest: `out/www`
                    },
                    {
                        expand: true,
                        cwd: `src`,
                        src: `content/font/*`,
                        dest: `out/www`
                    },
                    {
                        expand: true,
                        cwd: `src`,
                        src: `content/css/*`,
                        dest: `out/www`
                    },
                    {
                        expand: true,
                        cwd: `src`,
                        src: `images/*`,
                        dest: `out/www`
                    }
                ]
            },

            // 将生成的 es6 文件 copy 到 wwww
            es6: {
                files: [{
                    expand: true,
                    cwd: `out/es6/`,
                    src: `**/*.js`,
                    dest: `out/www`
                }]
            },

            // 将生成的 es5 文件 copy 到 wwww
            es5: {
                files: [{
                    expand: true,
                    cwd: `out/es5/`,
                    src: `**/*.js`,
                    dest: `out/www`
                }]
            }
        },
        less: {
            user: {
                files: [{
                        expand: true,
                        cwd: `src/modules`,
                        src: ['**/*.less'],
                        dest: `out/www/content/app`,
                        ext: '.css'
                    },
                    {
                        expand: true,
                        cwd: `src`,
                        src: [`*.less`],
                        dest: `out/www/content/app`,
                        ext: '.css'
                    },
                    {
                        expand: false,
                        src: `src/content/bootstrap-3.3.5/bootstrap.less`,
                        dest: `out/www/content/css/bootstrap.css`
                    }
                ]
            }
        },
        uglify: {
            es5: {
                files: [{
                    expand: true,
                    cwd: `out/es5`,
                    src: '**/*.js',
                    dest: `out/www`
                }]
            }
        },
        watch: {
            livereload: {
                options: {
                    livereload: 35729 //监听前面声明的端口  35729
                },
                files: [
                    `out/es6/**/*`
                ]
            }
        }
    });

    // console.log('fff');
    //===============================================================
    grunt.event.on('watch', function (action, filepath, target) {
        grunt.log.writeln(`action:${action}\n`);
        grunt.log.writeln(`filepath:${filepath}\n`);
        grunt.log.writeln(`target:${target}\n`);

        let target_pathname = filepath.replace('es6', 'www');
        grunt.log.writeln(`target_pathname:${target_pathname}\n`);

        grunt.file.copy(filepath, `${target_pathname}`);

    });
    //===============================================================

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('es6', ['shell', 'copy:js_es6', 'copy:source', 'less', 'copy:es6']);
    grunt.registerTask('es5', ['shell', 'copy:js_es6', 'babel', 'copy:source', 'less', 'copy:es5']);
    grunt.registerTask('build', ['es5', 'uglify']);
    grunt.registerTask('run', ['connect', 'watch']);

    grunt.registerTask('build-run', ['build', 'run']);
    grunt.registerTask('dev', ['es6', 'run']);


}