
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const searchYoutube = require('youtube-api-v3-search');
const Youtube = require('discord-youtube-api'); //https://www.npmjs.com/package/discord-youtube-api
const client = new Discord.Client();
let msg = require('./string');
const youtube = new Youtube(msg.apiKey);


let queue = [];

/// #TODO
////// # COLOCAR UM COMANDO PARA ACELERAR A MÚSICA?
////// # COLOCAR UM COMANDO PARA AVANÇAR A MÚSICA?
////// # CRIAR BOX PARA COLOCAR AS MENSAGENS ANTES DE ENVIAR PELO MESSAGE.CHANNEL.SEND
//////////// ASSIM O BOT NÃO VAI ENNVIAR DE UMA VEZ AS MENSAGENS
////// #Será que se colocar uma mensagem de recepção vai ficar zuado?

const play = (connection, channel, message) => {
    // console.log(queue[0]);


    connection.playStream(ytdl(queue[0].link, { filter: 'audioonly', highWaterMark: 1 << 25 })).on('end', () => {

        queue.shift();
        if (queue[0]) {

            play(connection, channel);
        } else {
            channel.leave();
        }

    })
}
const searchPlay = (target, connection, voiceChannel, message, callback) => {

    searchYoutube(msg.apiKey, { q: target, maxResults: 10, type: 'video' }).then(result => {

        let link = `https://www.youtube.com/watch?v=${result.items[0].id.videoId}`;
        let posArtista = result.items[0].snippet.title.indexOf("-");
        let title = result.items[0].snippet.title.substring(0, posArtista - 1);
        let musicTitle = result.items[0].snippet.title.substring(posArtista + 1);
        let music = {
            tittle: title,
            music: musicTitle,
            link: link
        }


        queue.push(music);

        callback(link);

    }).catch((err) => {
        voiceChannel.leave();
        console.error(err);
        message.channel.send(msg.erroSearch);
    });
}
client.on('ready', () => {
    console.log("ok");
    client.user.setActivity('#help', { type: 1 });
});
client.on('message', message => {

    let clientGuild = client.guilds.get(message.member.guild.id);
    var voiceChannel = message.member.voiceChannel;
    let index = message.content.indexOf(' ');
    let url = message.content.substring(index + 1);
    if (clientGuild.region !== "brazil") {
        msg = require('./stringEN');
    }


    switch (message.content.substring(0, 5)) {
        case '#play':


            if (voiceChannel === undefined) return message.channel.send(msg.emocionado);

            if (message.content.indexOf(' ') === -1) {
                message.channel.send(msg.erroPlay);

            } else {

                if (clientGuild.voiceConnection) {

                    searchPlay(url, clientGuild.voiceConnection, voiceChannel, message, (link) => {
                        if (!(clientGuild.region !== "brazil")) {
                            message.channel.send(`BURRRRRRRRRRRP!!! what's coming up is snatched ${link}`)
                        } else {
                            message.channel.send(`BURRRRRRRRRRRP!!! Vamos ver se o que esta por vir é bom ${link} `);
                        }
                    });

                } else {
                    voiceChannel.join().then(connection => {

                        searchPlay(url, connection, voiceChannel, message, () => {
                            if (!(clientGuild.region !== "brazil")) {
                                message.channel.send(`Wubba Lubba Dub Dub Woooooow yeeeeh!!!! Let's hear ${queue[0].tittle}`);
                            } else {
                                message.channel.send(`Wubba Lubba Dub Dub Woooooow yeeeeh!!!! Bora escutar ${queue[0].tittle}`);
                            }

                            message.channel.send(queue[0].link);
                            play(connection, voiceChannel);
                        })
                    });

                };
            }
            break;

        case '#paus':
            if (voiceChannel === undefined) return message.channel.send(msg.emocionado);
            if (!clientGuild.voiceConnection.dispatcher.paused) {
                message.channel.send(msg.pause);
                clientGuild.voiceConnection.dispatcher.pause();
            } else {
                message.channel.send(msg.erroPause);
            }

            break;
        case '#resu':
            if (voiceChannel === undefined) return message.channel.send(msg.emocionado);

            if (!clientGuild.voiceConnection.dispatcher.paused) {
                return message.channel.send(msg.arroto + msg.erroResume);
            } else {
                if (!clientGuild.voiceConnection.dispatcher.speaking) {
                    clientGuild.voiceConnection.dispatcher.resume()
                } else {
                    message.channel.send(msg.noMusicAngry);
                    voiceChannel.leave();
                }
            }


            break;
        case "#stop":
            if (voiceChannel === undefined) return message.channel.send(msg.emocionado);
            if (clientGuild.voiceConnection === null) return message.channel.send(msg.erroStop2);

            do {
                queue.pop();
            } while (queue.length !== 0);

            if (clientGuild.voiceConnection) {

                clientGuild.voiceConnection.dispatcher.end();
                voiceChannel.leave();

            } else {
                message.channel.send(msg.erroStop);
                clientGuild.voiceConnection.leave();
            }

            break;
        case "#next":
            if (voiceChannel === undefined) return message.channel.send(msg.emocionado);
            clientGuild.voiceConnection.dispatcher.end();

            break;
        case "#list":
            if (voiceChannel === undefined) return message.channel.send(msg.emocionado);
            if (queue.length == 1) {
                return message.channel.send(msg.erroList);
            }
            if (queue.length == 0) {
                return message.channel.send(msg.listEmpty);
            }
            for (let i = 0; i < queue.length; i++) {
                if (i == 0) {
                    if (clientGuild.region !== "brazil") {
                        message.channel.send(`LISTENING NOW - [${i + 1}] - ${queue[i].tittle} - ${queue[i].music}`);
                    } else {
                        message.channel.send(`REPRODUZINDO AGORA - [${i}] - ${queue[i].tittle}  - ${queue[i].music}`);
                    }

                } else {
                    message.channel.send(`[${i + 1}] - ${queue[i].tittle}  - ${queue[i].music}`);
                }

            }



            break;
        case "#help":
            message.channel.send(msg.help);

            break;
        case "#remo":
            queue.pop();
            break;
        case "#albu":

            if (voiceChannel === undefined) return message.channel.send(msg.emocionado);
            let playListId;
            // https://www.youtube.com/watch?v=OPqUDOjDJLI&list=PLEE-L5Au_XzcMCaRPfPQNNWS54b6EK7l6
            if (url.substr(0, 4) === 'http') {
                let firstEqual = url.indexOf('list=');
                url = url.substr(firstEqual + 5);
            }

            searchYoutube(msg.apiKey, { q: url, maxResults: 10, type: 'playlist' }).then(result => {
                let albumTittle = result.items[0].snippet.title;
                playListId = result.items[0].id.playlistId;


                youtube.getPlaylistByID(playListId).then(videos => {

                    for (let i = 0; i < videos.length; i++) {
                        let music = {
                            tittle: videos[i].data.items[0].snippet.title,
                            link: `https://www.youtube.com/watch?v=${videos[i].id}`
                        }
                        queue.push(music);
                    }

                    if (clientGuild.region !== "brazil") {
                        message.channel.send(` Wubba Lubba Dub Dub Woooooow yeeeeh!!!!  take ready for the trip morty`);
                        message.channel.send(`${videos.length} tracks from ${albumTittle} added to the queue`);
                        message.channel.send(`tip #list to see full list`);
                        message.channel.send(`take the first track: ${queue[0].tittle}`);
                        message.channel.send(` ${queue[0].link}`);
                    } else {
                        message.channel.send(`Wubba Lubba Dub Dub Woooooow yeeeeh!!!! Se prepare para a viajem morty!`);
                        message.channel.send(`${videos.length} músicas do album ${albumTittle} foram adicionadas na lista.`);
                        message.channel.send(`Digite #list para ver a lista completa!`);
                        message.channel.send(`Lá vai a primeira pedrada ${queue[0].tittle}`);
                        message.channel.send(` ${queue[0].link}`);
                    }






                    if (clientGuild.voiceConnection === null) {
                        voiceChannel.join().then(connection => {
                            play(connection, voiceChannel);
                        })
                    }
                })
            });
            break;
    }
});


client.login(msg.token);
