'use strict'

var validator = require('validator');
var fs = require('fs');
var path = require('path');
// const articles = require('../models/article');
var Article = require('../models/article');
const { exists } = require('../models/article');
const article = require('../models/article');
// const { param } = require('../routes/article');

var controller = {
    datosCurso: (req, res) => {
        return res.status(200).send({
            curso: 'Master en Frameworks JS',
            autor: 'Victor Herrera',
            url: 'youtube.com'
        });
    },

    test: (req, res) => {
        return res.status(200).send({
            message: 'Soy la accion de mi controlador de articulos'
        });
    },

    save: (req, res) => {
        // Recoger parametros por post
        var params = req.body;

        // Valida datos (validator)
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Faltan datos por enviar'
            });
        }

        if (validate_title && validate_content) {
            // Crear el objeto a guardar
            var article = new Article();

            // Asignar valores
            article.title = params.title;
            article.content = params.content;
            article.image = null;

            // Guardar el articulo
            article.save((err, articleStored) => {
                if (err || !articleStored) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'El articulo no se ha guardado'
                    });
                }
                // Devolver una respuesta
                return res.status(200).send({
                    status: 'succes',
                    article: articleStored
                });
            })
        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son validos'
            });
        }
    },

    getArticles: (req, res) => {

        var query = Article.find({});

        var last = req.params.last;
        if (last || last != undefined) {
            query.limit(5);
        }

        // FIND
        query.sort('-_id').exec((err, articles) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al devolver los articulos'
                });
            }

            if (!articles) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay articulos para mostrar'
                });
            }

            return res.status(200).send({
                status: 'success',
                articles
            });
        });
    },

    getArticle: (req, res) => {
        // Rewcoder ID de la url
        var articleId = req.params.id;
        // Comprobar si existe
        if (!articleId || articleId == null) {
            return res.status(404).send({
                status: 'error',
                message: 'No existe el articulo'
            });
        }
        // Buscar el articulo
        Article.findById(articleId, (err, article) => {
            if (!article || err) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el articulo'
                });
            }
            // Devolverlo
            return res.status(200).send({
                status: 'success',
                article
            });
        });
    },

    // UPDATE
    update: (req, res) => {
        // Recoger ID del articulo por url
        var articleId = req.params.id;

        // Recoger los datos que llegan por pUT
        var params = req.body;

        // Validar los datos
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Faltan datos por enviar'
            });
        }

        if (validate_title && validate_content) {
            // Find and Update
            Article.findOneAndUpdate({ _id: articleId }, params, { new: true }, (err, articleUpdate) => {
                if (err) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'Error al actualizar'
                    });
                }

                if (!articleUpdate) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No existe el articulo'
                    });
                }

                return res.status(200).send({
                    status: 'success',
                    message: articleUpdate
                });
            });
        } else {
            // Devolver respuesta
            return res.status(200).send({
                status: 'error',
                message: 'La validacion no es correcta'
            });
        }

    },

    // DELETE
    delete: (req, res) => {
        // REcoger el ID
        var articleId = req.params.id;

        // hacaer un find and delete
        Article.findByIdAndDelete({ _id: articleId }, (err, articleRemove) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al borrar'
                });
            }

            if (!articleRemove) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha borrado el articulo como posiblemente no exista'
                });
            }

            return res.status(200).send({
                status: 'success',
                article: articleRemove
            });
        });
    },

    // Image
    upload: (req, res) => {
        // Configurar el modulo connect multiparty router/article.js


        // Recoger el fichero
        var fileName = 'Imagen no subida...';

        if (!req.files) {
            return res.status(404).send({
                status: 'error',
                message: fileName
            });
        }

        // Conseguir el nombre y la extension del archivo
        var filePath = req.files.file0.path;
        var fileSplit = filePath.split('\\');

        // Nombre del archvo
        var fileName = fileSplit[2];

        // extension del fichero
        var extSplit = fileName.split('\.');
        var fileExt = extSplit[1];

        // Comprobar la extesion (solo imagenes), si no es valido borrarlo
        if (fileExt != 'png' && fileExt != 'jpg' && fileExt != 'jpeg' && fileExt != 'gif') {
            // Borrar el archivo
            fs.unlink(filePath, (err) => {
                return res.status(200).send({
                    status: 'error',
                    message: 'La extension de la imagen no es valida'
                });
            });
        } else {
            // si todo es valido
            var articleId = req.params.id;

            // buscar el articulo, asignarle el nombre de la imagen y actualizarlo
            Article.findOneAndUpdate({ _id: articleId }, { image: fileName }, { new: true }, (err, articleUpdate) => {
                if (err || !articleUpdate) {
                    return res.status(200).send({
                        status: 'error',
                        message: 'Error al guardar imagen'
                    })
                }
                return res.status(200).send({
                    status: 'success',
                    article: articleUpdate
                });
            });

        }
    },

    // DEVOLVER IMAGEN

    getImage: (req, res) => {
        var file = req.params.image;
        var pathFile = './upload/articles/' + file;

        fs.exists(pathFile, (exists) => {
            if (exists) {
                return res.sendFile(path.resolve(pathFile));
            } else {
                return res.status(404).send({
                    status: 'success',
                    message: 'La imagen no existe'
                });
            }
        });

    },

    // Buscar

    search: (req, res) => {
        // Sacar el string a buscar
        var searchString = req.params.search;

        // Find or
        Article.find({
                "$or": [{
                        "title": { "$regex": searchString, "$options": "i" }
                    },
                    {
                        "content": { "$regex": searchString, "$options": "i" }
                    }
                ]
            })
            .sort([
                ['date', 'descending']
            ])
            .exec((err, articles) => {
                if (err) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'error en la peticion'
                    });
                }
                if (!articles || articles.length <= 0) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No hay articulos para mostrar'
                    });
                }
                return res.status(200).send({
                    status: 'success',
                    articles
                });
            });

    }
};

module.exports = controller;