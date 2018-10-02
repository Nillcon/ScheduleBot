"use strict";
const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const MySql = require('mysql');
const fs = require('fs');
const Schedule = require('./schedule');
const TOKEN = "618486231:AAGr8w61qwdhCAqi5765NXVDQwQ5UTk71aQ";
const bot = new TelegramBot(TOKEN, {polling: true});
let urlShedule = 'http://schedule.college.ks.ua';
let schedule = new Schedule(bot, MySql, request, fs, urlShedule);

//Запрос на расписание
schedule.updateJsonFile();
//Команда start
bot.onText(/\/start/, function (msg) {
  let greetingMsg = "Приветствую! Я бот с расписанием ХПТК, добавьте свою группу и вы будете видеть уведомление со своим расписанием на следующий день. Укажите свою группу командой /mygroup [номер группы]";
  bot.sendMessage(msg.from.id, greetingMsg);
});

//Команда mygroup для указания своей группы
bot.onText(/\/mygroup/, function (msg, [sourse, match]) {
  schedule.setGroup(msg.from.id, msg.text);
});

//Команда schedule для получения расписания по своей или указаной группе
bot.onText(/\/schedule/, function (msg, [sourse, match]) {
  schedule.getSchedule(msg.from.id, msg.text);
});

//Команда bells для получения расписание звонков
bot.onText(/\/bells/, function (msg) {
  schedule.getBells(msg.from.id);
});
