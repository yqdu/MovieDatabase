const mongoCollections = require("../config/mongoCollections");
const movies = mongoCollections.movies;
//keep consistent in ES
//advanced searching using ../elasticsearch
const uuid = require('node-uuid');
const fs = require('fs');

let exportedMethods = {
    getAllMovies() {
        return movies().then((movieCollection) => {
            return movieCollection.find({}).toArray();
        });
    },

    getTopTen() {
        return this.getAllMovies().then((movies) => {
            movies.sort((movie1, movie2) => {
                let score1 = movie1.score;
                let score2 = movie2.score;
                if (!score1) score1 = -1;
                if (!score2) score2 = -1;
                return score2 - score1;
            });
            // let topTen = movies.slice(0, (movies.length < 10 ? movies.length : 10));
            // console.log(topTen.length)
            return movies.slice(0, (movies.length < 10 ? movies.length : 10));
        })
    },

    getMovieById(id) {
        return movies().then((movieCollection) => {
            return movieCollection.findOne({ _id: id }).then((movie) => {
                // if (!movie) {
                //     throw "Movie not found!";
                // }
                return movie;
            })
        });
    },

    getMovieByMovieName(name) {
        return movies().then((movieCollection) => {
            return movieCollection.findOne({ name: name }).then((movie) => {
                // if (!movie) {
                //     throw "Movie not found!";
                // }
                return movie;
            })
        });
    },

    addMovie(movie) {
        return movies().then((movieCollection) => {
            //data from front end includes name, year, directors, stars, writers, description, poster and category
            // xss process in API server
            let newMovie = {
                _id: uuid.v4(),
                name: movie.name,
                year: movie.year,
                score: undefined,
                commentNum: 0,
                watchedUsers: [],
                wishingUsers: [],
                directors: movie.directors,
                stars: movie.stars,
                writers: movie.writers,
                description: movie.description,
                category: movie.category
            };
            
            fs.createReadStream(movie.poster).pipe(fs.createWriteStream('../FrontEnd/public/processedposters/' + newMovie._id + '.png'));
            newMovie.poster = newMovie._id + '.png';
            newMovie.screenShots = [];
            // console.log(movie.screenShots)
            movie.screenShots.forEach((screen) => {
                // console.log(screen)
                screenID = uuid.v4()
                fs.createReadStream(screen).pipe(fs.createWriteStream('../FrontEnd/public/processedscreens/' + screenID + '.png'));
                newMovie.screenShots.push(screenID + '.png');
            })
            return movieCollection.findOne({
                name: movie.name
            }).then((movie) => {
                if (movie) {
                    return false;
                } else {
                    return movieCollection.insertOne(newMovie).then((insertInfo) => {
                        return insertInfo.insertedId;
                    }).then((newId) => {
                        console.log("added a movie!")
                        return this.getMovieById(newId);
                    }).catch((e) => {
                        return false;
                        // throw "Error inserting into MongoDB!"
                    })
                }
            })
        });
    },

    /*
    removeMovie() {

    },
    */

    // call es.addMovie to update in ES

    updateMovieInfo(updateMovie) {
        return movies().then((movieCollection) => {
            let updateInfo = {
                name: updateMovie.name,
                year: updateMovie.year,
                directors: updateMovie.directors,
                stars: updateMovie.stars,
                writers: updateMovie.writers,
                description: updateMovie.description,
                category: updateMovie.category
            }
            let updateCommand = {
                $set: updateInfo
            };
            return movieCollection.updateOne({ _id: updateMovie._id }, updateCommand).then((result) => {
                return this.getMovieById(updateMovie._id);
            })
        })
    },

    // search given keyword in all movie
    searchInMovie(keyword) {
        return movies().then((movieCollection) => {
            return movieCollection.find({name: keyword}).toArray();
        });
    },

    getMoviesByIdList(ids) {
        let promises = [];
        if (ids) {
            ids.forEach((id) => {
                promises.push(this.getMovieById(id));
            })
        }
        return Promise.all(promises).then((values) => {
            return values;
        })

    },

    // search for given category
    searchByCategory(category) {
        return movies().then((movieCollection) => {
            return movieCollection.find({category: category}).toArray();
        });
    },

    // search for keyword in given category
    searchInCategory(category, keyword) {
        return movies().then((movieCollection) => {
            return movieCollection.find({category: category, name: keyword}).toArray();
        });
    },

    addScreenshotToMovie(movieId, screenShots) {
        return movies().then((movieCollection) => {
            let screens = [];
            screenShots.forEach((screen) => {
                screens.push(screen);
            })
            return movies().then((movieCollection) => {
                return movieCollection.findOne({ _id: movieId }).then((movie) => {
                    movie.screenShots.forEach((screen) => {
                        screens.push(screen);
                    });

                    return movieCollection.updateOne({ _id: movieId }, {
                        $set: {
                            screenShots: screens
                        }
                    }).then((result) => {
                        return this.getMovieById(movieId);
                    })
                })
            });

        });
    },

    updateWatchedUsers(movieId, userId) {
        return movies().then((movieCollection) => {
            return movieCollection.updateOne({ _id: movieId }, {
                $addToSet: {
                    watchedUsers: userId
                }
            });
        });
    },

    updateWishingUsers(movieId, userId) {
        return movies().then((movieCollection) => {
            return movieCollection.updateOne({ _id: movieId }, {
                $addToSet: {
                    wishingUsers: userId
                }
            });
        });
    },

    removeWishingUsers(movieId, userId) {
        return movies().then((movieCollection) => {
            return movieCollection.updateOne({ _id: movieId }, {
                $pull: {
                    wishingUsers: userId
                }
            });
        });
    },

    //call it when add new comment
    addScore(movieId, score) {
        return movies().then((movieCollection) => {
            return this.getMovieById(movieId).then((movie) => {
                let newScore;
                if (!movie.score || movie.commentNum === 0) {
                    newScore = score;
                } else {
                    newScore = (movie.score * movie.commentNum + score) / (movie.commentNum + 1);
                }
                let updateInfo = {
                    score: newScore,
                    commentNum: movie.commentNum + 1
                };

                let updateCommand = {
                    $set: updateInfo
                };
                return movieCollection.updateOne({ _id: movieId }, updateCommand).then((result) => {
                    return this.getMovieById(movieId);
                });
            });
        });
    },
    //call it when update comment
    updateScore(movieId, newScore, oldScore) {
        return movies().then((movieCollection) => {
            return this.getMovieById(movieId).then((movie) => {
                let score;
                if (!movie.score || movie.commentNum === 0) {
                    score = newScore;
                } else {
                    score = (movie.score * movie.commentNum + newScore - oldScore) / (movie.commentNum);
                }
                let updateInfo = {
                    score: newScore,
                };
                let updateCommand = {
                    $set: updateInfo
                };
                return movieCollection.updateOne({ _id: movieId }, updateCommand).then((result) => {
                    return this.getMovieById(movieId);
                });
            });
        });
    },

    //call it when delete comment
    removeScore(movieId, score) {
        return movies().then((movieCollection) => {
            return this.getMovieById(movieId).then((movie) => {
                let newScore;
                if (movie.commentNum === 1) {
                    newScore = undefined;
                } else {
                    newScore = (movie.score * movie.commentNum - score) / (movie.commentNum - 1);
                }
                let updateInfo = {
                    score: newScore,
                    commentNum: movie.commentNum - 1
                };
                let updateCommand = {
                    $set: updateInfo,
                };
                return movieCollection.updateOne({ _id: movieId }, updateCommand).then((result) => {
                    return this.getMovieById(movieId);
                });
            });
        });
    },
}

module.exports = exportedMethods;