'use strict';

module.exports = class Schedule {
  constructor(bot, mysql, request, fs, urlShedule) {
    this.bot = bot;
    this.mysql = mysql;
    this.request = request;
    this.fs = fs;
    this.dayOfWeek = (day, type) => {
      if (day) {
        if (type == "EngRus") {
          return  (day == 'tu')? "Вiвторок":
                  (day == 'we')? "Середа":
                  (day == 'th')? "Четвер":
                  (day == 'fr')? "П'ятниця":
                  (day == 'sa')? "Субота":
                  "Понедiлок";
        }
        else if (type == "RusEng") {
          return  (day == 'вт')? "tu":
                  (day == 'ср')? "we":
                  (day == 'чт')? "th":
                  (day == 'пт')? "fr":
                  (day == 'сб')? "sa":
                  "mo";
        }
      }
      else return ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'mo'][new Date().getDay() - 1];
    }
    this.urlShedule = urlShedule;
    this.DB = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'scheduleKsUa'
    }
    this.strip = "\r\n--------------------------------------\r\n";
  }

  updateJsonFile(date = new Date().getHours()) {
    //Запрос на замены (раз в час, работает от 6 утра до 8 вечера)
    setInterval(() => {
      if (date > 6 && date < 20) {
        this.request.post(
          {
            url: this.urlShedule + `/json/${new Date().getFullYear()}/%D0%97%D0%B0%D0%BC%D0%B5%D0%BD%D1%8B.json?` + Math.random()
          },
          (err, res, body) => {
            this.fs.writeFile("../json/replacements.json", body);
          }
        )
      }
    }, 3600000);
    //Запрос на расписание предметов (раз в 3 дня, работает в любое время)
    setInterval(() => {
      this.request.post(
        {
          url: this.urlShedule + `/json/${new Date().getFullYear()}/%D0%A0%D0%BE%D0%B7%D0%BA%D0%BB%D0%B0%D0%B4%20-%202%20%D1%81%D0%B5%D0%BC%D0%B5%D1%81%D1%82%D1%80%20[${new Date().getFullYear()}].json?${Math.random()}`
        },
        (err, res, body) => {
          this.fs.writeFile("../json/schedule.json", body);
        }
      );
    }, 86400000*3)
    //Запрос на файл с дополнительными настройками (раз в день, работает в любое время)
    setInterval(() => {
      this.request.post(
        {
          url: this.urlShedule + `/json/otherThings.json?${Math.random()}`
        },
        (err, res, body) => {
          this.fs.writeFile("../json/otherThings.json", body);
        }
      )
    }, 86400000);
    //Запрос на файл с расписанием звонков (раз в день, работает в любое время)
    setInterval(() => {
      this.request.post(
        {
          url: this.urlShedule + `/json/bells.json?${Math.random()}`
        },
        (err, res, body) => {
          this.fs.writeFile("../json/bells.json", body);
        }
      )
    }, 86400000);
    //Запрос на файл со списком групп (раз в день, работает в любое время)
    setInterval(() => {
      this.request.post(
        {
          url: this.urlShedule + `/json/${new Date().getFullYear()}/groups.json?${Math.random()}`
        },
        (err, res, body) => {
          this.fs.writeFile("../json/groups.json", body);
        }
      )
    }, 86400000);

  }

  getSchedule(id, dataInput) {
    //Берем файл с расписанием и заменой
    let schedule = JSON.parse(this.fs.readFileSync('../json/schedule.json', 'utf-8', (error, data) => {
      if (error){
        console.log(error);
        return false;
      };
    }));
    let replace = JSON.parse(this.fs.readFileSync('../json/replacements.json', 'utf-8', (error, data) => {
      if (error){
        console.log(error);
        return false;
      };
    }));
    let otherThings = JSON.parse(this.fs.readFileSync('../json/otherThings.json', 'utf-8', (error, data) => {
      if (error){
        console.log(error);
        return false;
      };
    }))
    let users = JSON.parse(this.fs.readFileSync('../json/users.json', 'utf-8', (error, data) => {
      if (error) {
        console.log(error);
        return 0;
      }
    }));
    //Нахождение дополнительных аргументов
    let dayWeek = dataInput.match(/пн|вт|ср|чт|пт|сб/);
    let group = dataInput.match(/[0-9]+/);
    let week = dataInput.match(/знам|числ/);
    //Формирование ответного сообщения
    //Определяем группу
    if (group == undefined) {
      for (let i = 0; i < users.length; i++) {
        if (users[i][`id`] == id) group = users[i][`group`];
      }
    }
    //Определяем день недели
    let day = (dayWeek)?  this.dayOfWeek(dayWeek[0], 'RusEng')
    : ['mo','mo', 'tu', 'we', 'th', 'fr', 'sa'][new Date().getDay()];
    //Определяем тип недели
    let weekType = otherThings['weekType'];
    if (week) {
      switch (week[0]) {
        case 'числ':
          weekType = 'weekA';
          break;
        case 'знам':
          weekType = 'weekB';
          break;
      }
    }
    //Определяем тип недели для использования его в сообщении
    let weekTypeMess = (weekType == `weekA`)? `Числiвник`: `Знаменник`;
    //Формируем заголовок сообщения
    let message =  `День: ${this.dayOfWeek(day, 'EngRus')} \r\nТиждень: ${weekTypeMess} ${this.strip}`;
    //Формируем расписание
    if (schedule[`data`][`group-${group}`]) {
      if (weekType == 'weekA') {
        for (let i = 0; i < schedule['data'][`group-${group}`][`${day}`].length; i++) {
          if (schedule['data'][`group-${group}`][`${day}`][i][`name`]) {
            message += `${i+1}) ` + schedule['data'][`group-${group}`][`${day}`][i][`name`] + ': ' + schedule['data'][`group-${group}`][day][i]['class'] + '-' + schedule['data'][`group-${group}`][day][i][`corps`] + `\r\n`;
          }
          else message += `${i+1}) Вiдсутня \r\n`;
        };
      }
      else if (weekType == 'weekB') {
        for (let i = 0; i < schedule['data'][`group-${group}`][`${day}`].length; i++) {
          if (schedule['data'][`group-${group}`][`${day}`][i][`weekB`][`isset`] == true) {
            if (schedule['data'][`group-${group}`][`${day}`][i][`weekB`][`name`]) {
              message += `${i+1}) ` + schedule['data'][`group-${group}`][`${day}`][i][`weekB`][`name`] + ': ' + schedule['data'][`group-${group}`][day][i][`weekB`]['class'] + '-' + schedule['data'][`group-${group}`][day][i][`weekB`][`corps`] + `\r\n`;
            }
            else message += `${i+1}) Вiдсутня \r\n`;
          }
          else {
            if (schedule['data'][`group-${group}`][`${day}`][i][`name`]) {
              message += `${i+1}) ` + schedule['data'][`group-${group}`][`${day}`][i][`name`] + ': ' + schedule['data'][`group-${group}`][day][i]['class'] + '-' + schedule['data'][`group-${group}`][day][i][`corps`] + `\r\n`;
            }
            else message += `${i+1}) Вiдсутня \r\n`;
          }
        };
      }
      message += `${this.strip}Замiни: ${this.strip}`;
      if (replace['data'][`group-${group}`]) {
        for (let i = 0; i < replace['data'][`group-${group}`][`${day}`].length; i++) {
        if (replace[`data`][`group-${group}`][`${day}`][i][`name`]) {
          message += replace[`data`][`group-${group}`][`${day}`][i][`ind`] + `) ` + replace[`data`][`group-${group}`][`${day}`][i][`name`] + `: ` + replace[`data`][`group-${group}`][`${day}`][i][`class`] + '-' + replace[`data`][`group-${group}`][`${day}`][i][`corps`] + `\r\n`;
        }
      }
      }
    }
    else message = `Групи ${group} не iснує`;

    this.bot.sendMessage(id, message);
  }

  getBells(id) {
    let otherThings = JSON.parse(this.fs.readFileSync('../json/otherThings.json', 'utf-8', (error, data) => {
      if (error){
        console.log(error);
        return false;
      };
    }))
    let bells = JSON.parse(this.fs.readFileSync('../json/bells.json', 'utf-8', (error, data) => {
      if (error){
        console.log(error);
        return false;
      };
    }))
    let currentBell = otherThings[`currentBellScheduleIndex`];
    let message = `Розклад дзвiнкiв ${this.strip}`;
    for (let i = 0; i < bells[`${currentBell}`][`mainSchedule`].length; i++) {
      if (bells[`${currentBell}`][`mainSchedule`][i][`starts`]) {
        message += `${i+1}\t)\t${bells[`${currentBell}`][`mainSchedule`][`${i}`][`starts`]}\t-\t${bells[`${currentBell}`][`mainSchedule`][`${i}`][`ending`]}\t| перерва\t${bells[`${currentBell}`][`breaksList`][`${bells[`${currentBell}`][`mainSchedule`][`${i}`][`breakType`]}`]} хвилин;\r\n`;
      }
    }
    this.bot.sendMessage(id, message);
  }

  setGroup(id, dataInput){
    let groups = JSON.parse(this.fs.readFileSync('../json/groups.json', 'utf-8', (error, data) => {
      if (error) {
        console.log(error);
        return 0;
      }
    }));
    let users = JSON.parse(this.fs.readFileSync('../json/users.json', 'utf-8', (error, data) => {
      if (error) {
        console.log(error);
        return 0;
      }
    }));
    let connection = this.mysql.createConnection(this.DB);
    connection.connect();
    connection.query('SELECT * FROM `Users`');

    let group = dataInput.match(/[0-9]+/);
    if (group) {
      let user = {
        "id": id,
        "group": group
      }
      for (let i = 0; i < groups.length; i++) {
        if (groups[i][`group`] == group) {
          for (let j = 0; j < users.length; j++) {
            if (users[j][`id`] == user[`id`]) {
              users[j][`group`] = user[`group`];
              this.fs.writeFile('../json/users.json', JSON.stringify(users));
              this.bot.sendMessage(id, `Теперь ваша группа - ${group}`);
              return true;
            }
          };
          users.push(user);
          connection.query('INSERT INTO `Users` (`id`, `idUser`, `groupNumber`) VALUES (NULL, 'user.id', 'user.group')';
          //this.fs.writeFile('../json/users.json', JSON.stringify(users));
          this.bot.sendMessage(id, `Теперь ваша группа - ${group}`);
          return true;
        }
      }
      this.bot.sendMessage(id, `Групи ${group} не iснує`);
    }
    else {
      for (let i = 0; i < users.length; i++) {
        if (users[i][`id`] == id) {
          this.bot.sendMessage(id, `Ваша група ${users[i]['group']}`);
          return true;
        }
      }
      this.bot.sendMessage(id, "Додайте свою групу командою /mygroup [номер], щоб наступного разу не вказувати її командою /schedule");
    }
  }
}
