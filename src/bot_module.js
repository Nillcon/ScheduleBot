/*
const request = require('request');
const urlShedule = "http://schedule.college.ks.ua";
const telegramBot = require('node-telegram-bot-api');
const token = "618486231:AAGr8w61qwdhCAqi5765NXVDQwQ5UTk71aQ";
const bot = new telegramBot(token, {polling: true});*/
const fs = require('fs');
module.exports.updateUser = function (idUser, idGroup) {
  let users = fs.readFile('Users.json');
};

module.exports.getShedule = function (idUser, idGroup) {
  request.post({
      url: urlShedule + '/json/2018/%D0%A0%D0%BE%D0%B7%D0%BA%D0%BB%D0%B0%D0%B4%20-%202%20%D1%81%D0%B5%D0%BC%D0%B5%D1%81%D1%82%D1%80%20[2018].json?1',
      form:{}
    },
    function(err, res, body) {
      var shedule = JSON.parse(body);
      if (shedule.data[`group-${idGroup}`]){
        for (var i = 0; i < shedule.data[`group-${idGroup}`]['fr'].length; i++) {
          bot.sendMessage(idUser, shedule.data[`group-${idGroup}`]['fr'][i]['name']);
        };
      } else bot.sendMessage(idUser, "Такой группы не существует!");
  });
};
