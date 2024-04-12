(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.bundle = f() } })(function () {
    var define, module, exports; return (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o } return r })()({
      1: [function (require, module, exports) {
        var dates = require('./modules/handle_dates');
        var ribbon = require('./modules/ribbon');
        var ui = require('./modules/gen_ui');
        var dayjs = require('dayjs');
        var customParseFormat = require('dayjs/plugin/customParseFormat');
        const List = require('list.js');
        dayjs.extend(customParseFormat);

        //load external css
        var cssId = 'ribbon-schedule-custom-css';  // you could encode the css path itself to generate id..
        if (!document.getElementById(cssId)) {
          var head = document.getElementsByTagName('head')[0];
          var link = document.createElement('link');
          link.id = cssId;
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = "https://momence.com/css/weekly-plugin.css";
          link.media = 'all';
          head.appendChild(link);
        }
  
        //basic state
        let refDay = dayjs();
        let weekStart = dates.getWeekStart(refDay);
        let week = dates.initWeek(weekStart);
        let container = document.getElementById("ribbon-schedule");
        let ribbonEvents,
          eventsThisWeek,
          ribbon_event_list,
          refDayEvents;
        //end basic state
  
        let ribbon_root_tag = document.getElementById('ribbon-schedule-view-scriptroot');
        let got_host_id = ribbon_root_tag.dataset.host
        let got_host_token = ribbon_root_tag.dataset.token;
  
        let got_teacher = ribbon_root_tag.dataset.teacher;
        let got_eventType = ribbon_root_tag.dataset.eventtype;
        let got_location = ribbon_root_tag.dataset.location;
  
  
        const initRibbon = async (hostId, token) => {
          let ribbonData = await ribbon.getRibbonData(hostId, token);
  
          return ribbonData;
        }
  
        const setWeekEvents = (data) => {
          eventsThisWeek = ribbon.getWeekEvents(data, week[0], week[6]);
          refDayEvents = ribbon.getRefDayEvents(data, refDay);
        }
  
        const fire_search = () => {
          let filters = document.querySelectorAll('.list_filter');
  
          let filter_string = "";
  
          filters.forEach((f) => {
            if (f.disabled == false) {
              f.value == "" ? "" : filter_string = filter_string + f.value + " "
            }
          });
  
          ribbon_event_list.search(filter_string);
        }
  
        const setFilterParams = (params) => {
          let search_string = '';
  
          function elemSelect(e, v) {
            let doesValExist = document.getElementById(e).querySelector('[value="' + v + '"]');
    
            if (document.getElementById(e) !== null && doesValExist !== null) {
              document.getElementById(e).value = v;
            } else if (document.getElementById(e) !== null && doesValExist == null) {
              let filterOption = document.createElement("option");
  
              filterOption.value = params.teacher;
              filterOption.innerHTML = params.teacher;
  
              document.getElementById(e).appendChild(filterOption);
  
              document.getElementById(e).value = v;
            }
  
          }
  
          if (params.teacher !== undefined) {
            elemSelect("teacher_filter", params.teacher);
  
            search_string = search_string + `"${params.teacher}" `;
          }
  
          if (params.eventType !== undefined) {
            elemSelect("eventType_filter", params.eventType.toLowerCase());
  
            search_string = search_string + `"${params.eventType}" `;
          }
  
          if (params.location !== undefined) {
            elemSelect("location_filter", params.location);
  
            search_string = search_string + `"${params.location}" `;
          }
  
          ribbon_event_list.search(search_string);
        }
  
        const resetEventList = () => {
          setWeekEvents(ribbonEvents);
          ui.buildEventList(refDayEvents);
          init_list();
          if (refDayEvents.length > 0) {
            addFilterListeners();
            setFilterParams({
              teacher: got_teacher,
              eventType: got_eventType,
              location: got_location
            });
          }
        }
  
        const addDayListeners = () => {
          let wd_elems = document.querySelectorAll(".week_day");
  
          wd_elems.forEach((el) => {
            el.addEventListener('click', (e) => {
              setRefDay(e.target.id);
              resetEventList();
            })
          })
        }
  
        const addFilterListeners = () => {
          let filter_elems = document.querySelectorAll(".list_filter");
          filter_elems.forEach((el) => {
            el.addEventListener('change', () => {
              fire_search();
              // ribbon_event_list.search(e.target.value);
            });
          });
        }
  
        const init_list = () => {
          let eventList = document.getElementById("event_list_container");
  
          let listOptions = {
            valueNames: [{ data: ['id'] },
            { name: 'online', attr: 'data-online' },
              'teacher_name',
              'class_time',
              'class_duration',
              'class_location',
              'livestream_inperson'
            ]
          }
  
          ribbon_event_list = new List(eventList, listOptions)
            .on("updated", (e) => {
              if (e.matchingItems.length === 0) {
                let em = document.createElement("div");
                em.innerHTML = ui.returnEmptyMessage();
                eventList.appendChild(em);
              } else {
                let emr = document.querySelectorAll(".no_events");
  
                if (emr.length > 0) {
                  emr[0].parentNode.removeChild(emr[0]);
                }
              }
            });
  
          ribbon_event_list.sort('class_time', {
            sortFunction: (a, b) => {
              if (dayjs(a.elm.attributes["data-classtime"].value).isBefore(dayjs(b.elm.attributes["data-classtime"].value))) return -1;
              else return 1;
            }
          });
        }
  
        const initSchedule = () => {
          ui.createUI(container, week, refDay);
          dates.findRefDay(refDay);
  
          setWeekEvents(ribbonEvents);
          ui.buildEventList(refDayEvents);
  
          init_list();
          addDayListeners();
  
          if (refDayEvents.length > 0) {
            addFilterListeners();
            setFilterParams({
              teacher: got_teacher,
              eventType: got_eventType,
              location: got_location
            });
          }
  
        }
  
        const resetSchedule = (w) => {
          week = dates.initWeek(w);
  
          container.innerHTML = "";
          initSchedule();
        }
  
        const backToToday = () => {
          refDay = dayjs();
          resetSchedule(dates.getWeekStart(refDay));
        }
  
        const toggleWeek = (iterator) => {
          let newWeekStart = dates.changeWeek(iterator, refDay);
          refDay = newWeekStart;
  
          resetSchedule(newWeekStart);
        }
  
        const setRefDay = (d) => {
          let new_refDay = dayjs(d, "DDMMYYYY");
  
          refDay = new_refDay;
          dates.findRefDay(new_refDay, 1);
  
          document.getElementById("selected_date").innerHTML = dayjs(d, "DDMMYYYY").format("dddd, MMMM D, YYYY")
        }
  
        initRibbon(got_host_id, got_host_token).then((data) => {
          ribbonEvents = data;
          initSchedule();
        });
  
  
  
        module.exports = {
          toggleWeek: toggleWeek,
          backToToday: backToToday,
          setRefDay: setRefDay
        }
      }, { "./modules/gen_ui": 2, "./modules/handle_dates": 3, "./modules/ribbon": 4, "dayjs": 5, "dayjs/plugin/customParseFormat": 6, "dayjs/plugin/utc": 29, "dayjs/plugin/timezone": 28, "list.js": 11 }], 2: [function (require, module, exports) {
        var dayjs = require('dayjs');
        const List = require('list.js');
        var ribbon = require('./ribbon');

        var dayjsUtc = require('dayjs/plugin/utc');
        var dayjsTimezone = require('dayjs/plugin/timezone');
        dayjs.extend(dayjsUtc);
        dayjs.extend(dayjsTimezone);
  
  
        const buildDay = (d) => {
          let new_elem = document.createElement("div");
          new_elem.id = d.format("DDMMYYYY");
          new_elem.innerHTML = `<p class="day_of_week">${d.format("ddd").toUpperCase()}</p><p class="short_date">${d.format("MMM D")}</p>`;
  
          new_elem.classList.add("week_day");
          if (d.isBefore(dayjs().subtract(1, 'day'))) {
            new_elem.classList.add("in_past");
          }
  
          return new_elem;
        }
  
        const buildEventListContainer = () => {
          let elc = document.createElement('div');
          elc.innerHTML = "<ul class='list' id='inner_list'></ul>"
          elc.classList.add("event_list_container");
          elc.id = "event_list_container";
          return elc;
        }
  
        const buildPrevButton = () => {
          let prevButton = document.createElement("div");
          prevButton.classList.add("prevButton")
          prevButton.innerHTML = `<button class="momence__button" onClick="bundle.toggleWeek(0)">←</button>`;
  
          return prevButton;
        }
  
        const buildNextButton = () => {
          let nextButton = document.createElement("div");
          nextButton.classList.add("nextButton")
          nextButton.innerHTML = `<button class="momence__button" onClick="bundle.toggleWeek(1)">→</button>`;
  
          return nextButton;
        }
  
        const buildEventLineItem = (e, hostTimezone) => {
  
          let live_or_location;
  
          if (e.online === false) {
            live_or_location = e.location;
          } else live_or_location = `<div style="margin-top: 10px; display: flex; flex-direction: row; align-items: center;"><img height="12px" width="18px" src="https://momence.com/images/noun_streaming.png" alt="streaming by Javier Sánchez - javyliu from the Noun Project"><span class="livestream_label" style="margin-left: 5px;">Livestream</span></div>`
  
          let onlineFlag = e.online == true ? "livestream" : "inperson";
          const bothOnlineAndInPerson = !!e.onlineEventId && !!e.inPersonEventId
          const locationWithIcon = `<img height="15px" width="15px" src="https://momence.com/images/instudioicon_grey.png" alt="streaming by Javier Sánchez - javyliu from the Noun Project" ><span class="livestream_label" style="margin-left: 4px;">${e.location}</span>`
  
          let lineItem = document.createElement("li");
          lineItem.setAttribute("data-id", dayjs(e.dateTime).tz(hostTimezone).format("DDMMYYYY"));
          lineItem.setAttribute("data-classtime", e.dateTime);
          lineItem.setAttribute("data-online", e.online == true ? "livestream" : "inperson");
          lineItem.classList.add('schedule_item');
          lineItem.innerHTML = `<div class="time_dur">
                                      <span class="class_time">${dayjs(e.dateTime).tz(hostTimezone).format("hh:mm A")}</span><br>
                                      <span class="class_duration">${e.duration} min</span>
                                      ${bothOnlineAndInPerson ? `<span class="class_location mobile_loc">${locationWithIcon}</span><span class="class_location mobile_loc">${live_or_location}</span>` : `<span class="class_location mobile_loc">${live_or_location}</span>`}
                                      <span class="livestream_inperson">${onlineFlag}</span>
                                  </div>
                                  <div class="class_location_container desktop_loc">
                                      ${bothOnlineAndInPerson ? `<span class="class_location">${locationWithIcon}</span><span class="class_location">${live_or_location}</span>` : `<span class="class_location">${live_or_location}</span>`}
                                  </div>`;
  
          let signUpButton = document.createElement("div");
          signUpButton.classList.add("sign_up_button_container");
          const bookOrWaitlist = !!e.capacity && e.ticketsSold >= e.capacity && e.allowWaitlist ? "Join Waitlist" : "Book"    
          signUpButton.innerHTML = `${bothOnlineAndInPerson ? `<a class="sign_up_button" href="https://momence.com/plugin/hybrid/?o=${e.onlineEventId}&s=${e.inPersonEventId}" target="_blank">${bookOrWaitlist}</a>` : `<a class="sign_up_button" href="https://momence.com/s/${e.id}" target="_blank">${bookOrWaitlist}</a>`}`;
  
          if (e.image2 !== null || !!e.teacherId) {
            let teacherImg = document.createElement('div');
            teacherImg.classList.add("teacher_img");
            teacherImg.style.backgroundImage = `url("${encodeURI(e.image2 ?? `https://ribbon-technologes-images.s3.us-east-2.amazonaws.com/${e.teacherId}-picture.jpg`)}")`;
            teacherImg.style.backgroundSize = 'cover';
  
            lineItem.appendChild(teacherImg);
          }
  
          let eTitle = document.createElement("div");
          eTitle.classList.add("event_title");
          eTitle.innerHTML = `<span>${e.title}</span><br><span class="teacher_name">${e.teacher || "No Teacher"}</span><br>${e.teacherId !== e.originalTeacherId ? `<span class="teacher_name">Subst. for ${e.originalTeacher}</span>` : ``}`;
  
          lineItem.appendChild(eTitle);
  
          if (e.isCancelled) {
            let passedButton = document.createElement("div");
            passedButton.classList.add("sign_up_button_container");
            passedButton.innerHTML = "<div class='sign_up_button disabled_sign_up'>Cancelled</div>";
            passedButton.disabled = true;
  
            lineItem.append(passedButton);
          } else 
          if (dayjs(e.dateTime).tz(hostTimezone).isBefore(dayjs().tz(hostTimezone)) == false) {
            lineItem.appendChild(signUpButton);
          } else {
            let passedButton = document.createElement("div");
            passedButton.classList.add("sign_up_button_container");
            passedButton.innerHTML = "<div class='sign_up_button disabled_sign_up'>Closed</div>";
            passedButton.disabled = true;
  
            lineItem.append(passedButton);
          }
  
          return lineItem;
        }
  
        const returnEmptyMessage = () => {
          if (document.querySelectorAll(".no_events").length !== 0) {
            let emr = document.querySelectorAll(".no_events");
  
            if (emr.length > 0) {
              emr[0].parentNode.removeChild(emr[0]);
            }
          }
  
          return `<div class="no_events"><img height='100px' width='100px' src="https://momence.com/images/noun_empty_glass.png" alt='empty glass by Waiyi Fung from the Noun Project'><p>No Matching Events</p></div>`
        }
  
        const buildEventList = (ribbonEvents) => {
          let list_container = document.getElementById("inner_list");

          const getHostTimezone = () => ribbonEvents[0].hostId === 10781 ? "Europe/London" : dayjs.tz.guess()

          const hostTimezone = !!ribbonEvents.length ? getHostTimezone() : dayjs.tz.guess()
  
          list_container.innerHTML = "";
  
          let consolidatedEvents = []


  
          ribbonEvents.filter(rEvent => !!rEvent.published && !rEvent.isDeleted && rEvent.type !== "private" && rEvent.type !== "semester" && dayjs(rEvent.dateTime).tz(hostTimezone).isBefore(dayjs().tz(hostTimezone).subtract(1, "hour")) == false).forEach(rEvent => {
            const existing = consolidatedEvents.find(x => dayjs(x.dateTime).tz(hostTimezone).format() === dayjs(rEvent.dateTime).tz(hostTimezone).format() && x.teacherId === rEvent.teacherId && x.id===rEvent.id) //this is where Rhonda found the duplicate time entries.
            
            if (!existing) {
              consolidatedEvents.push({ ...rEvent, title: rEvent.title.split("(Livestream)").join(""), ...(rEvent.online ? { onlineEventId: rEvent.id } : { inPersonEventId: rEvent.id }) })
            } else {
              for (let i = 0; i < consolidatedEvents.length; i += 1) {
                const currentEvent = consolidatedEvents[i]
              
              if (dayjs(currentEvent.dateTime).tz(hostTimezone).format() === dayjs(rEvent.dateTime).tz(hostTimezone).format() && currentEvent.teacherId === rEvent.teacherId) {
                  if (rEvent.online) {
                    consolidatedEvents[i].online = true
                    consolidatedEvents[i].onlineEventId = rEvent.id
                  } else {
                    if (!consolidatedEvents[i].inPersonEventId) {
                      consolidatedEvents[i].title = rEvent.title // overwirte online title
                    }
                    consolidatedEvents[i].location = rEvent.location
                    consolidatedEvents[i].inPersonEventId = rEvent.id
                  }
                  break;
                }
              }
            }
          })

  
          if (consolidatedEvents.length == 0) {
            list_container.innerHTML = returnEmptyMessage();
          } else {
            consolidatedEvents.forEach((rEvent) => {
              list_container.appendChild(buildEventLineItem(rEvent, hostTimezone))
            });
          }
  
          buildDropdowns(ribbon.getUniqueTeachers(ribbonEvents), ribbonEvents.length, ribbonEvents);
        }
  
  
        const createUI = (elem, week, refDay) => {
          let week_container = document.createElement("div");
          week_container.id = "week_container";
  
          week_container.appendChild(buildPrevButton());
  
          week.forEach((day) => {
            let elem = buildDay(day);
  
            week_container.appendChild(elem);
          });
  
          week_container.appendChild(buildNextButton());
  
          let today_container = document.createElement("div");
          today_container.classList.add('today_container');
          today_container.innerHTML = `<span id="selected_date">${refDay.format("dddd, MMMM D, YYYY")}</span><button onClick='bundle.backToToday()'>Today</button>`;
  
          const detectMob = () => {
            const toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
  
            return toMatch.some((toMatchItem) => {
              return (
                navigator.userAgent.match(toMatchItem) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
              );
            });
          };
  
          let filter_container = document.createElement("div");
          filter_container.id = "filter_container";
          filter_container.classList.add("filter_container");
  
          if (detectMob()) {
            filter_container.style.display = "flex"
            filter_container.style.flexDirection = "column"
          }
  
  
          elem.appendChild(week_container);
  
          elem.appendChild(today_container);
  
          elem.appendChild(filter_container);
  
          elem.appendChild(buildEventListContainer());
  
        }
  
        const buildTeacherDropdown = (t) => {
          let genSelect = document.createElement("select");
          genSelect.classList.add("list_filter");
          genSelect.id = "teacher_filter";
  
          let selectAll = document.createElement("option");
  
          selectAll.value = "";
          selectAll.innerHTML = "Teacher";
  
          genSelect.appendChild(selectAll);
  
          t.forEach((name) => {
            let genOption = document.createElement("option");
  
            genOption.value = name;
            genOption.innerHTML = name;
  
            genSelect.appendChild(genOption);
          })
  
          switch (t.length) {
            case 0:
              return undefined
            default:
              return genSelect
          }
        }
  
  
        const buildEventTypeDropdown = () => {
          // let genSelect = document.createElement("select");
          // genSelect.classList.add("list_filter");
          // genSelect.id = "eventType_filter";
  
          // genSelect.innerHTML =  `<option value="">Type</option><option value="inperson">In Person</option><option value="livestream">Livestream</option>`;
  
          // return genSelect;
        }
  
        const buildLocationDropdown = (ev) => {
          // let genSelect = document.createElement("select");
          // genSelect.classList.add("list_filter");
          // genSelect.id = "location_filter";
  
          // let selectAll = document.createElement("option");
  
          // selectAll.value = "";
          // selectAll.innerHTML = "Location";
  
          // genSelect.appendChild(selectAll);
  
          // let locations = ev.map((e) => e.location || null);
  
          // let locSet = new Set(locations.filter(l => l !== null));
  
          // locSet.forEach((loc) => {
          //     let genOption = document.createElement("option");
  
          //     genOption.value = loc;
          //     genOption.innerHTML = loc;
  
          //     genSelect.appendChild(genOption);
          // });
  
          // let fakeSelect = document.createElement("select");
          // fakeSelect.classList.add("list_filter");
          // fakeSelect.disabled = true;
          // fakeSelect.innerHTML = "<option>Location</option>";
  
          // switch (locSet.size) {
          //     case 0:
          //         return fakeSelect;
          //     default:
          //         return genSelect;
          // }
        }
  
        const buildDropdowns = (teachers, length, events) => {
          let filter_container = document.getElementById("filter_container");
  
          if (filter_container.innerHTML !== "") {
            filter_container.innerHTML = ""
          }
  
          if (length > 0) {
            let teachDrop = buildTeacherDropdown(teachers);
  
            if (teachDrop !== undefined) filter_container.appendChild(teachDrop);
  
            // let stream_or_in_person = buildEventTypeDropdown();
  
            // filter_container.appendChild(stream_or_in_person);
  
            // let location_dropdown = buildLocationDropdown(events);
  
            // if(location_dropdown !== undefined) filter_container.appendChild(location_dropdown);
          }
        }
  
        module.exports = {
          createUI: createUI,
          buildEventList: buildEventList,
          buildDropdowns: buildDropdowns,
          returnEmptyMessage: returnEmptyMessage
        }
      }, { "./ribbon": 4, "dayjs": 5, "list.js": 11, "dayjs/plugin/utc": 29, "dayjs/plugin/timezone": 28,  }], 3: [function (require, module, exports) {
        var dayjs = require('dayjs');
  
        //extend w/ WOY plugin
        var weekOfYear = require('dayjs/plugin/weekOfYear');
        dayjs.extend(weekOfYear);
  
        const getWeekStart = (day) => {
  
          let dayOfWeek = day.day();
  
          switch (dayOfWeek) {
            case 0:
              return day;
            default:
              return day.subtract(dayOfWeek, 'day');
          }
        }
  
        const initWeek = (weekStart) => {
          let thisWeek = [];
  
          for (var i = 0; i <= 6; i++) {
            if (i == 0) {
              thisWeek.push(weekStart);
            } else if (i > 0) {
              thisWeek.push(dayjs(weekStart).add(i, 'day'));
            }
          }
  
          return thisWeek;
        }
  
        const changeWeek = (iterator, day) => {
          let weekStart = getWeekStart(day);
  
          switch (iterator) {
            case 0:
              return dayjs(weekStart).subtract(7, 'day');
            case 1:
              return dayjs(weekStart).add(7, 'day');
          }
        }
  
        const findRefDay = (d, o) => {
  
          let removeOldRefFlag = undefined || o;
  
          if (removeOldRefFlag !== undefined) {
            let old_ref = document.querySelectorAll('.selected_day');
            old_ref[0].classList.remove('selected_day');
  
            let selectedDay = document.getElementById(d.format("DDMMYYYY"));
            selectedDay.classList.add('selected_day');
          } else {
            let selectedDay = document.getElementById(d.format("DDMMYYYY"));
            selectedDay.classList.add('selected_day');
          }
  
  
        }
  
        module.exports = {
          changeWeek: changeWeek,
          initWeek: initWeek,
          getWeekStart: getWeekStart,
          findRefDay: findRefDay
        }
      }, { "dayjs": 5, "dayjs/plugin/weekOfYear": 7 }], 4: [function (require, module, exports) {
        var dayjs = require('dayjs');
        var customParseFormat = require('dayjs/plugin/customParseFormat');
        dayjs.extend(customParseFormat);
  
  
        const getRibbonData = async (hostId, token) => {
          const ribbonRes = fetch(`https://api.momence.com/api/v1/Events?hostId=${hostId}&token=${token}`)
            .then(response => response.json())
            .then(data => { return data })
            .catch((err) => console.log(err));
  
          return ribbonRes
        }
  
        const getUniqueTeachers = (data) => {
          let teachArray = data.map((e) => e.teacher || "No Teacher Set");
  
          switch (data.length) {
            case 0:
              return [];
            default:
              let uniqTeach = new Set(teachArray);
              return uniqTeach;
          }
  
  
        }
  
        const getRefDayEvents = (data, refDay) => {
          let todaysEvents = data.filter(event => {
            return dayjs(event.dateTime).isSame(refDay, 'day');
          });
  
          return todaysEvents;
        }
  
        const getWeekEvents = (data, first, last) => {
          let week_data = [];
  
          data.forEach((d) => {
            if (dayjs(d.dateTime).isAfter(first) && dayjs(d.dateTime).isBefore(last)) {
              week_data.push(d);
            }
          });
  
          return week_data;
        }
  
        module.exports = {
          getRibbonData: getRibbonData,
          getWeekEvents: getWeekEvents,
          getRefDayEvents: getRefDayEvents,
          getUniqueTeachers: getUniqueTeachers
        }
      }, { "dayjs": 5, "dayjs/plugin/customParseFormat": 6 }], 5: [function (require, module, exports) {
        !function (t, e) { "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs = e() }(this, (function () { "use strict"; var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", f = "month", h = "quarter", c = "year", d = "date", $ = "Invalid Date", l = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_") }, m = function (t, e, n) { var r = String(t); return !r || r.length >= e ? t : "" + Array(e + 1 - r.length).join(n) + t }, g = { s: m, z: function (t) { var e = -t.utcOffset(), n = Math.abs(e), r = Math.floor(n / 60), i = n % 60; return (e <= 0 ? "+" : "-") + m(r, 2, "0") + ":" + m(i, 2, "0") }, m: function t(e, n) { if (e.date() < n.date()) return -t(n, e); var r = 12 * (n.year() - e.year()) + (n.month() - e.month()), i = e.clone().add(r, f), s = n - i < 0, u = e.clone().add(r + (s ? -1 : 1), f); return +(-(r + (n - i) / (s ? i - u : u - i)) || 0) }, a: function (t) { return t < 0 ? Math.ceil(t) || 0 : Math.floor(t) }, p: function (t) { return { M: f, y: c, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: h }[t] || String(t || "").toLowerCase().replace(/s$/, "") }, u: function (t) { return void 0 === t } }, D = "en", v = {}; v[D] = M; var p = function (t) { return t instanceof _ }, S = function (t, e, n) { var r; if (!t) return D; if ("string" == typeof t) v[t] && (r = t), e && (v[t] = e, r = t); else { var i = t.name; v[i] = t, r = i } return !n && r && (D = r), r || !n && D }, w = function (t, e) { if (p(t)) return t.clone(); var n = "object" == typeof e ? e : {}; return n.date = t, n.args = arguments, new _(n) }, O = g; O.l = S, O.i = p, O.w = function (t, e) { return w(t, { locale: e.$L, utc: e.$u, x: e.$x, $offset: e.$offset }) }; var _ = function () { function M(t) { this.$L = S(t.locale, null, !0), this.parse(t) } var m = M.prototype; return m.parse = function (t) { this.$d = function (t) { var e = t.date, n = t.utc; if (null === e) return new Date(NaN); if (O.u(e)) return new Date; if (e instanceof Date) return new Date(e); if ("string" == typeof e && !/Z$/i.test(e)) { var r = e.match(l); if (r) { var i = r[2] - 1 || 0, s = (r[7] || "0").substring(0, 3); return n ? new Date(Date.UTC(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s)) : new Date(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s) } } return new Date(e) }(t), this.$x = t.x || {}, this.init() }, m.init = function () { var t = this.$d; this.$y = t.getFullYear(), this.$M = t.getMonth(), this.$D = t.getDate(), this.$W = t.getDay(), this.$H = t.getHours(), this.$m = t.getMinutes(), this.$s = t.getSeconds(), this.$ms = t.getMilliseconds() }, m.$utils = function () { return O }, m.isValid = function () { return !(this.$d.toString() === $) }, m.isSame = function (t, e) { var n = w(t); return this.startOf(e) <= n && n <= this.endOf(e) }, m.isAfter = function (t, e) { return w(t) < this.startOf(e) }, m.isBefore = function (t, e) { return this.endOf(e) < w(t) }, m.$g = function (t, e, n) { return O.u(t) ? this[e] : this.set(n, t) }, m.unix = function () { return Math.floor(this.valueOf() / 1e3) }, m.valueOf = function () { return this.$d.getTime() }, m.startOf = function (t, e) { var n = this, r = !!O.u(e) || e, h = O.p(t), $ = function (t, e) { var i = O.w(n.$u ? Date.UTC(n.$y, e, t) : new Date(n.$y, e, t), n); return r ? i : i.endOf(a) }, l = function (t, e) { return O.w(n.toDate()[t].apply(n.toDate("s"), (r ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e)), n) }, y = this.$W, M = this.$M, m = this.$D, g = "set" + (this.$u ? "UTC" : ""); switch (h) { case c: return r ? $(1, 0) : $(31, 11); case f: return r ? $(1, M) : $(0, M + 1); case o: var D = this.$locale().weekStart || 0, v = (y < D ? y + 7 : y) - D; return $(r ? m - v : m + (6 - v), M); case a: case d: return l(g + "Hours", 0); case u: return l(g + "Minutes", 1); case s: return l(g + "Seconds", 2); case i: return l(g + "Milliseconds", 3); default: return this.clone() } }, m.endOf = function (t) { return this.startOf(t, !1) }, m.$set = function (t, e) { var n, o = O.p(t), h = "set" + (this.$u ? "UTC" : ""), $ = (n = {}, n[a] = h + "Date", n[d] = h + "Date", n[f] = h + "Month", n[c] = h + "FullYear", n[u] = h + "Hours", n[s] = h + "Minutes", n[i] = h + "Seconds", n[r] = h + "Milliseconds", n)[o], l = o === a ? this.$D + (e - this.$W) : e; if (o === f || o === c) { var y = this.clone().set(d, 1); y.$d[$](l), y.init(), this.$d = y.set(d, Math.min(this.$D, y.daysInMonth())).$d } else $ && this.$d[$](l); return this.init(), this }, m.set = function (t, e) { return this.clone().$set(t, e) }, m.get = function (t) { return this[O.p(t)]() }, m.add = function (r, h) { var d, $ = this; r = Number(r); var l = O.p(h), y = function (t) { var e = w($); return O.w(e.date(e.date() + Math.round(t * r)), $) }; if (l === f) return this.set(f, this.$M + r); if (l === c) return this.set(c, this.$y + r); if (l === a) return y(1); if (l === o) return y(7); var M = (d = {}, d[s] = e, d[u] = n, d[i] = t, d)[l] || 1, m = this.$d.getTime() + r * M; return O.w(m, this) }, m.subtract = function (t, e) { return this.add(-1 * t, e) }, m.format = function (t) { var e = this; if (!this.isValid()) return $; var n = t || "YYYY-MM-DDTHH:mm:ssZ", r = O.z(this), i = this.$locale(), s = this.$H, u = this.$m, a = this.$M, o = i.weekdays, f = i.months, h = function (t, r, i, s) { return t && (t[r] || t(e, n)) || i[r].substr(0, s) }, c = function (t) { return O.s(s % 12 || 12, t, "0") }, d = i.meridiem || function (t, e, n) { var r = t < 12 ? "AM" : "PM"; return n ? r.toLowerCase() : r }, l = { YY: String(this.$y).slice(-2), YYYY: this.$y, M: a + 1, MM: O.s(a + 1, 2, "0"), MMM: h(i.monthsShort, a, f, 3), MMMM: h(f, a), D: this.$D, DD: O.s(this.$D, 2, "0"), d: String(this.$W), dd: h(i.weekdaysMin, this.$W, o, 2), ddd: h(i.weekdaysShort, this.$W, o, 3), dddd: o[this.$W], H: String(s), HH: O.s(s, 2, "0"), h: c(1), hh: c(2), a: d(s, u, !0), A: d(s, u, !1), m: String(u), mm: O.s(u, 2, "0"), s: String(this.$s), ss: O.s(this.$s, 2, "0"), SSS: O.s(this.$ms, 3, "0"), Z: r }; return n.replace(y, (function (t, e) { return e || l[t] || r.replace(":", "") })) }, m.utcOffset = function () { return 15 * -Math.round(this.$d.getTimezoneOffset() / 15) }, m.diff = function (r, d, $) { var l, y = O.p(d), M = w(r), m = (M.utcOffset() - this.utcOffset()) * e, g = this - M, D = O.m(this, M); return D = (l = {}, l[c] = D / 12, l[f] = D, l[h] = D / 3, l[o] = (g - m) / 6048e5, l[a] = (g - m) / 864e5, l[u] = g / n, l[s] = g / e, l[i] = g / t, l)[y] || g, $ ? D : O.a(D) }, m.daysInMonth = function () { return this.endOf(f).$D }, m.$locale = function () { return v[this.$L] }, m.locale = function (t, e) { if (!t) return this.$L; var n = this.clone(), r = S(t, e, !0); return r && (n.$L = r), n }, m.clone = function () { return O.w(this.$d, this) }, m.toDate = function () { return new Date(this.valueOf()) }, m.toJSON = function () { return this.isValid() ? this.toISOString() : null }, m.toISOString = function () { return this.$d.toISOString() }, m.toString = function () { return this.$d.toUTCString() }, M }(), b = _.prototype; return w.prototype = b, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", f], ["$y", c], ["$D", d]].forEach((function (t) { b[t[1]] = function (e) { return this.$g(e, t[0], t[1]) } })), w.extend = function (t, e) { return t.$i || (t(e, _, w), t.$i = !0), w }, w.locale = S, w.isDayjs = p, w.unix = function (t) { return w(1e3 * t) }, w.en = v[D], w.Ls = v, w.p = {}, w }));
      }, {}], 6: [function (require, module, exports) {
        !function (t, e) { "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs_plugin_customParseFormat = e() }(this, (function () { "use strict"; var t = { LTS: "h:mm:ss A", LT: "h:mm A", L: "MM/DD/YYYY", LL: "MMMM D, YYYY", LLL: "MMMM D, YYYY h:mm A", LLLL: "dddd, MMMM D, YYYY h:mm A" }, e = /(\[[^[]*\])|([-:/.()\s]+)|(A|a|YYYY|YY?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g, n = /\d\d/, r = /\d\d?/, i = /\d*[^\s\d-_:/()]+/, o = {}; var s = function (t) { return function (e) { this[t] = +e } }, a = [/[+-]\d\d:?(\d\d)?|Z/, function (t) { (this.zone || (this.zone = {})).offset = function (t) { if (!t) return 0; if ("Z" === t) return 0; var e = t.match(/([+-]|\d\d)/g), n = 60 * e[1] + (+e[2] || 0); return 0 === n ? 0 : "+" === e[0] ? -n : n }(t) }], f = function (t) { var e = o[t]; return e && (e.indexOf ? e : e.s.concat(e.f)) }, h = function (t, e) { var n, r = o.meridiem; if (r) { for (var i = 1; i <= 24; i += 1)if (t.indexOf(r(i, 0, e)) > -1) { n = i > 12; break } } else n = t === (e ? "pm" : "PM"); return n }, u = { A: [i, function (t) { this.afternoon = h(t, !1) }], a: [i, function (t) { this.afternoon = h(t, !0) }], S: [/\d/, function (t) { this.milliseconds = 100 * +t }], SS: [n, function (t) { this.milliseconds = 10 * +t }], SSS: [/\d{3}/, function (t) { this.milliseconds = +t }], s: [r, s("seconds")], ss: [r, s("seconds")], m: [r, s("minutes")], mm: [r, s("minutes")], H: [r, s("hours")], h: [r, s("hours")], HH: [r, s("hours")], hh: [r, s("hours")], D: [r, s("day")], DD: [n, s("day")], Do: [i, function (t) { var e = o.ordinal, n = t.match(/\d+/); if (this.day = n[0], e) for (var r = 1; r <= 31; r += 1)e(r).replace(/\[|\]/g, "") === t && (this.day = r) }], M: [r, s("month")], MM: [n, s("month")], MMM: [i, function (t) { var e = f("months"), n = (f("monthsShort") || e.map((function (t) { return t.substr(0, 3) }))).indexOf(t) + 1; if (n < 1) throw new Error; this.month = n % 12 || n }], MMMM: [i, function (t) { var e = f("months").indexOf(t) + 1; if (e < 1) throw new Error; this.month = e % 12 || e }], Y: [/[+-]?\d+/, s("year")], YY: [n, function (t) { t = +t, this.year = t + (t > 68 ? 1900 : 2e3) }], YYYY: [/\d{4}/, s("year")], Z: a, ZZ: a }; function d(n) { var r, i; r = n, i = o && o.formats; for (var s = (n = r.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g, (function (e, n, r) { var o = r && r.toUpperCase(); return n || i[r] || t[r] || i[o].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g, (function (t, e, n) { return e || n.slice(1) })) }))).match(e), a = s.length, f = 0; f < a; f += 1) { var h = s[f], d = u[h], c = d && d[0], l = d && d[1]; s[f] = l ? { regex: c, parser: l } : h.replace(/^\[|\]$/g, "") } return function (t) { for (var e = {}, n = 0, r = 0; n < a; n += 1) { var i = s[n]; if ("string" == typeof i) r += i.length; else { var o = i.regex, f = i.parser, h = t.substr(r), u = o.exec(h)[0]; f.call(e, u), t = t.replace(u, "") } } return function (t) { var e = t.afternoon; if (void 0 !== e) { var n = t.hours; e ? n < 12 && (t.hours += 12) : 12 === n && (t.hours = 0), delete t.afternoon } }(e), e } } return function (t, e, n) { n.p.customParseFormat = !0; var r = e.prototype, i = r.parse; r.parse = function (t) { var e = t.date, r = t.utc, s = t.args; this.$u = r; var a = s[1]; if ("string" == typeof a) { var f = !0 === s[2], h = !0 === s[3], u = f || h, c = s[2]; h && (c = s[2]), o = this.$locale(), !f && c && (o = n.Ls[c]), this.$d = function (t, e, n) { try { var r = d(e)(t), i = r.year, o = r.month, s = r.day, a = r.hours, f = r.minutes, h = r.seconds, u = r.milliseconds, c = r.zone, l = new Date, m = s || (i || o ? 1 : l.getDate()), M = i || l.getFullYear(), Y = 0; i && !o || (Y = o > 0 ? o - 1 : l.getMonth()); var v = a || 0, p = f || 0, D = h || 0, g = u || 0; return c ? new Date(Date.UTC(M, Y, m, v, p, D, g + 60 * c.offset * 1e3)) : n ? new Date(Date.UTC(M, Y, m, v, p, D, g)) : new Date(M, Y, m, v, p, D, g) } catch (t) { return new Date("") } }(e, a, r), this.init(), c && !0 !== c && (this.$L = this.locale(c).$L), u && e !== this.format(a) && (this.$d = new Date("")), o = {} } else if (a instanceof Array) for (var l = a.length, m = 1; m <= l; m += 1) { s[1] = a[m - 1]; var M = n.apply(this, s); if (M.isValid()) { this.$d = M.$d, this.$L = M.$L, this.init(); break } m === l && (this.$d = new Date("")) } else i.call(this, t) } } }));
      }, {}], 7: [function (require, module, exports) {
        !function (e, t) { "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_weekOfYear = t() }(this, (function () { "use strict"; var e = "week", t = "year"; return function (i, n, r) { var f = n.prototype; f.week = function (i) { if (void 0 === i && (i = null), null !== i) return this.add(7 * (i - this.week()), "day"); var n = this.$locale().yearStart || 1; if (11 === this.month() && this.date() > 25) { var f = r(this).startOf(t).add(1, t).date(n), s = r(this).endOf(e); if (f.isBefore(s)) return 1 } var a = r(this).startOf(t).date(n).startOf(e).subtract(1, "millisecond"), o = this.diff(a, e, !0); return o < 0 ? r(this).startOf("week").week() : Math.ceil(o) }, f.weeks = function (e) { return void 0 === e && (e = null), this.week(e) } } }));
      }, {}], 8: [function (require, module, exports) {
        module.exports = function (list) {
          var addAsync = function (values, callback, items) {
            var valuesToAdd = values.splice(0, 50)
            items = items || []
            items = items.concat(list.add(valuesToAdd))
            if (values.length > 0) {
              setTimeout(function () {
                addAsync(values, callback, items)
              }, 1)
            } else {
              list.update()
              callback(items)
            }
          }
          return addAsync
        }
  
      }, {}], 9: [function (require, module, exports) {
        module.exports = function (list) {
          // Add handlers
          list.handlers.filterStart = list.handlers.filterStart || []
          list.handlers.filterComplete = list.handlers.filterComplete || []
  
          return function (filterFunction) {
            list.trigger('filterStart')
            list.i = 1 // Reset paging
            list.reset.filter()
            if (filterFunction === undefined) {
              list.filtered = false
            } else {
              list.filtered = true
              var is = list.items
              for (var i = 0, il = is.length; i < il; i++) {
                var item = is[i]
                if (filterFunction(item)) {
                  item.filtered = true
                } else {
                  item.filtered = false
                }
              }
            }
            list.update()
            list.trigger('filterComplete')
            return list.visibleItems
          }
        }
  
      }, {}], 10: [function (require, module, exports) {
        var classes = require('./utils/classes'),
          events = require('./utils/events'),
          extend = require('./utils/extend'),
          toString = require('./utils/to-string'),
          getByClass = require('./utils/get-by-class'),
          fuzzy = require('./utils/fuzzy')
  
        module.exports = function (list, options) {
          options = options || {}
  
          options = extend(
            {
              location: 0,
              distance: 100,
              threshold: 0.4,
              multiSearch: true,
              searchClass: 'fuzzy-search',
            },
            options
          )
  
          var fuzzySearch = {
            search: function (searchString, columns) {
              // Substract arguments from the searchString or put searchString as only argument
              var searchArguments = options.multiSearch ? searchString.replace(/ +$/, '').split(/ +/) : [searchString]
  
              for (var k = 0, kl = list.items.length; k < kl; k++) {
                fuzzySearch.item(list.items[k], columns, searchArguments)
              }
            },
            item: function (item, columns, searchArguments) {
              var found = true
              for (var i = 0; i < searchArguments.length; i++) {
                var foundArgument = false
                for (var j = 0, jl = columns.length; j < jl; j++) {
                  if (fuzzySearch.values(item.values(), columns[j], searchArguments[i])) {
                    foundArgument = true
                  }
                }
                if (!foundArgument) {
                  found = false
                }
              }
              item.found = found
            },
            values: function (values, value, searchArgument) {
              if (values.hasOwnProperty(value)) {
                var text = toString(values[value]).toLowerCase()
  
                if (fuzzy(text, searchArgument, options)) {
                  return true
                }
              }
              return false
            },
          }
  
          events.bind(
            getByClass(list.listContainer, options.searchClass),
            'keyup',
            list.utils.events.debounce(function (e) {
              var target = e.target || e.srcElement // IE have srcElement
              list.search(target.value, fuzzySearch.search)
            }, list.searchDelay)
          )
  
          return function (str, columns) {
            list.search(str, columns, fuzzySearch.search)
          }
        }
  
      }, { "./utils/classes": 18, "./utils/events": 19, "./utils/extend": 20, "./utils/fuzzy": 21, "./utils/get-by-class": 23, "./utils/to-string": 26 }], 11: [function (require, module, exports) {
        var naturalSort = require('string-natural-compare'),
          getByClass = require('./utils/get-by-class'),
          extend = require('./utils/extend'),
          indexOf = require('./utils/index-of'),
          events = require('./utils/events'),
          toString = require('./utils/to-string'),
          classes = require('./utils/classes'),
          getAttribute = require('./utils/get-attribute'),
          toArray = require('./utils/to-array')
  
        module.exports = function (id, options, values) {
          var self = this,
            init,
            Item = require('./item')(self),
            addAsync = require('./add-async')(self),
            initPagination = require('./pagination')(self)
  
          init = {
            start: function () {
              self.listClass = 'list'
              self.searchClass = 'search'
              self.sortClass = 'sort'
              self.page = 10000
              self.i = 1
              self.items = []
              self.visibleItems = []
              self.matchingItems = []
              self.searched = false
              self.filtered = false
              self.searchColumns = undefined
              self.searchDelay = 0
              self.handlers = { updated: [] }
              self.valueNames = []
              self.utils = {
                getByClass: getByClass,
                extend: extend,
                indexOf: indexOf,
                events: events,
                toString: toString,
                naturalSort: naturalSort,
                classes: classes,
                getAttribute: getAttribute,
                toArray: toArray,
              }
  
              self.utils.extend(self, options)
  
              self.listContainer = typeof id === 'string' ? document.getElementById(id) : id
              if (!self.listContainer) {
                return
              }
              self.list = getByClass(self.listContainer, self.listClass, true)
  
              self.parse = require('./parse')(self)
              self.templater = require('./templater')(self)
              self.search = require('./search')(self)
              self.filter = require('./filter')(self)
              self.sort = require('./sort')(self)
              self.fuzzySearch = require('./fuzzy-search')(self, options.fuzzySearch)
  
              this.handlers()
              this.items()
              this.pagination()
  
              self.update()
            },
            handlers: function () {
              for (var handler in self.handlers) {
                if (self[handler] && self.handlers.hasOwnProperty(handler)) {
                  self.on(handler, self[handler])
                }
              }
            },
            items: function () {
              self.parse(self.list)
              if (values !== undefined) {
                self.add(values)
              }
            },
            pagination: function () {
              if (options.pagination !== undefined) {
                if (options.pagination === true) {
                  options.pagination = [{}]
                }
                if (options.pagination[0] === undefined) {
                  options.pagination = [options.pagination]
                }
                for (var i = 0, il = options.pagination.length; i < il; i++) {
                  initPagination(options.pagination[i])
                }
              }
            },
          }
  
          /*
           * Re-parse the List, use if html have changed
           */
          this.reIndex = function () {
            self.items = []
            self.visibleItems = []
            self.matchingItems = []
            self.searched = false
            self.filtered = false
            self.parse(self.list)
          }
  
          this.toJSON = function () {
            var json = []
            for (var i = 0, il = self.items.length; i < il; i++) {
              json.push(self.items[i].values())
            }
            return json
          }
  
          /*
           * Add object to list
           */
          this.add = function (values, callback) {
            if (values.length === 0) {
              return
            }
            if (callback) {
              addAsync(values.slice(0), callback)
              return
            }
            var added = [],
              notCreate = false
            if (values[0] === undefined) {
              values = [values]
            }
            for (var i = 0, il = values.length; i < il; i++) {
              var item = null
              notCreate = self.items.length > self.page ? true : false
              item = new Item(values[i], undefined, notCreate)
              self.items.push(item)
              added.push(item)
            }
            self.update()
            return added
          }
  
          this.show = function (i, page) {
            this.i = i
            this.page = page
            self.update()
            return self
          }
  
          /* Removes object from list.
           * Loops through the list and removes objects where
           * property "valuename" === value
           */
          this.remove = function (valueName, value, options) {
            var found = 0
            for (var i = 0, il = self.items.length; i < il; i++) {
              if (self.items[i].values()[valueName] == value) {
                self.templater.remove(self.items[i], options)
                self.items.splice(i, 1)
                il--
                i--
                found++
              }
            }
            self.update()
            return found
          }
  
          /* Gets the objects in the list which
           * property "valueName" === value
           */
          this.get = function (valueName, value) {
            var matchedItems = []
            for (var i = 0, il = self.items.length; i < il; i++) {
              var item = self.items[i]
              if (item.values()[valueName] == value) {
                matchedItems.push(item)
              }
            }
            return matchedItems
          }
  
          /*
           * Get size of the list
           */
          this.size = function () {
            return self.items.length
          }
  
          /*
           * Removes all items from the list
           */
          this.clear = function () {
            self.templater.clear()
            self.items = []
            return self
          }
  
          this.on = function (event, callback) {
            self.handlers[event].push(callback)
            return self
          }
  
          this.off = function (event, callback) {
            var e = self.handlers[event]
            var index = indexOf(e, callback)
            if (index > -1) {
              e.splice(index, 1)
            }
            return self
          }
  
          this.trigger = function (event) {
            var i = self.handlers[event].length
            while (i--) {
              self.handlers[event][i](self)
            }
            return self
          }
  
          this.reset = {
            filter: function () {
              var is = self.items,
                il = is.length
              while (il--) {
                is[il].filtered = false
              }
              return self
            },
            search: function () {
              var is = self.items,
                il = is.length
              while (il--) {
                is[il].found = false
              }
              return self
            },
          }
  
          this.update = function () {
            var is = self.items,
              il = is.length
  
            self.visibleItems = []
            self.matchingItems = []
            self.templater.clear()
            for (var i = 0; i < il; i++) {
              if (is[i].matching() && self.matchingItems.length + 1 >= self.i && self.visibleItems.length < self.page) {
                is[i].show()
                self.visibleItems.push(is[i])
                self.matchingItems.push(is[i])
              } else if (is[i].matching()) {
                self.matchingItems.push(is[i])
                is[i].hide()
              } else {
                is[i].hide()
              }
            }
            self.trigger('updated')
            return self
          }
  
          init.start()
        }
  
      }, { "./add-async": 8, "./filter": 9, "./fuzzy-search": 10, "./item": 12, "./pagination": 13, "./parse": 14, "./search": 15, "./sort": 16, "./templater": 17, "./utils/classes": 18, "./utils/events": 19, "./utils/extend": 20, "./utils/get-attribute": 22, "./utils/get-by-class": 23, "./utils/index-of": 24, "./utils/to-array": 25, "./utils/to-string": 26, "string-natural-compare": 27 }], 12: [function (require, module, exports) {
        module.exports = function (list) {
          return function (initValues, element, notCreate) {
            var item = this
  
            this._values = {}
  
            this.found = false // Show if list.searched == true and this.found == true
            this.filtered = false // Show if list.filtered == true and this.filtered == true
  
            var init = function (initValues, element, notCreate) {
              if (element === undefined) {
                if (notCreate) {
                  item.values(initValues, notCreate)
                } else {
                  item.values(initValues)
                }
              } else {
                item.elm = element
                var values = list.templater.get(item, initValues)
                item.values(values)
              }
            }
  
            this.values = function (newValues, notCreate) {
              if (newValues !== undefined) {
                for (var name in newValues) {
                  item._values[name] = newValues[name]
                }
                if (notCreate !== true) {
                  list.templater.set(item, item.values())
                }
              } else {
                return item._values
              }
            }
  
            this.show = function () {
              list.templater.show(item)
            }
  
            this.hide = function () {
              list.templater.hide(item)
            }
  
            this.matching = function () {
              return (
                (list.filtered && list.searched && item.found && item.filtered) ||
                (list.filtered && !list.searched && item.filtered) ||
                (!list.filtered && list.searched && item.found) ||
                (!list.filtered && !list.searched)
              )
            }
  
            this.visible = function () {
              return item.elm && item.elm.parentNode == list.list ? true : false
            }
  
            init(initValues, element, notCreate)
          }
        }
  
      }, {}], 13: [function (require, module, exports) {
        var classes = require('./utils/classes'),
          events = require('./utils/events'),
          List = require('./index')
  
        module.exports = function (list) {
          var isHidden = false
  
          var refresh = function (pagingList, options) {
            if (list.page < 1) {
              list.listContainer.style.display = 'none'
              isHidden = true
              return
            } else if (isHidden) {
              list.listContainer.style.display = 'block'
            }
  
            var item,
              l = list.matchingItems.length,
              index = list.i,
              page = list.page,
              pages = Math.ceil(l / page),
              currentPage = Math.ceil(index / page),
              innerWindow = options.innerWindow || 2,
              left = options.left || options.outerWindow || 0,
              right = options.right || options.outerWindow || 0
  
            right = pages - right
            pagingList.clear()
            for (var i = 1; i <= pages; i++) {
              var className = currentPage === i ? 'active' : ''
  
              //console.log(i, left, right, currentPage, (currentPage - innerWindow), (currentPage + innerWindow), className);
  
              if (is.number(i, left, right, currentPage, innerWindow)) {
                item = pagingList.add({
                  page: i,
                  dotted: false,
                })[0]
                if (className) {
                  classes(item.elm).add(className)
                }
                item.elm.firstChild.setAttribute('data-i', i)
                item.elm.firstChild.setAttribute('data-page', page)
              } else if (is.dotted(pagingList, i, left, right, currentPage, innerWindow, pagingList.size())) {
                item = pagingList.add({
                  page: '...',
                  dotted: true,
                })[0]
                classes(item.elm).add('disabled')
              }
            }
          }
  
          var is = {
            number: function (i, left, right, currentPage, innerWindow) {
              return this.left(i, left) || this.right(i, right) || this.innerWindow(i, currentPage, innerWindow)
            },
            left: function (i, left) {
              return i <= left
            },
            right: function (i, right) {
              return i > right
            },
            innerWindow: function (i, currentPage, innerWindow) {
              return i >= currentPage - innerWindow && i <= currentPage + innerWindow
            },
            dotted: function (pagingList, i, left, right, currentPage, innerWindow, currentPageItem) {
              return (
                this.dottedLeft(pagingList, i, left, right, currentPage, innerWindow) ||
                this.dottedRight(pagingList, i, left, right, currentPage, innerWindow, currentPageItem)
              )
            },
            dottedLeft: function (pagingList, i, left, right, currentPage, innerWindow) {
              return i == left + 1 && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right)
            },
            dottedRight: function (pagingList, i, left, right, currentPage, innerWindow, currentPageItem) {
              if (pagingList.items[currentPageItem - 1].values().dotted) {
                return false
              } else {
                return i == right && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right)
              }
            },
          }
  
          return function (options) {
            var pagingList = new List(list.listContainer.id, {
              listClass: options.paginationClass || 'pagination',
              item: options.item || "<li><a class='page' href='#'></a></li>",
              valueNames: ['page', 'dotted'],
              searchClass: 'pagination-search-that-is-not-supposed-to-exist',
              sortClass: 'pagination-sort-that-is-not-supposed-to-exist',
            })
  
            events.bind(pagingList.listContainer, 'click', function (e) {
              var target = e.target || e.srcElement,
                page = list.utils.getAttribute(target, 'data-page'),
                i = list.utils.getAttribute(target, 'data-i')
              if (i) {
                list.show((i - 1) * page + 1, page)
              }
            })
  
            list.on('updated', function () {
              refresh(pagingList, options)
            })
            refresh(pagingList, options)
          }
        }
  
      }, { "./index": 11, "./utils/classes": 18, "./utils/events": 19 }], 14: [function (require, module, exports) {
        module.exports = function (list) {
          var Item = require('./item')(list)
  
          var getChildren = function (parent) {
            var nodes = parent.childNodes,
              items = []
            for (var i = 0, il = nodes.length; i < il; i++) {
              // Only textnodes have a data attribute
              if (nodes[i].data === undefined) {
                items.push(nodes[i])
              }
            }
            return items
          }
  
          var parse = function (itemElements, valueNames) {
            for (var i = 0, il = itemElements.length; i < il; i++) {
              list.items.push(new Item(valueNames, itemElements[i]))
            }
          }
          var parseAsync = function (itemElements, valueNames) {
            var itemsToIndex = itemElements.splice(0, 50) // TODO: If < 100 items, what happens in IE etc?
            parse(itemsToIndex, valueNames)
            if (itemElements.length > 0) {
              setTimeout(function () {
                parseAsync(itemElements, valueNames)
              }, 1)
            } else {
              list.update()
              list.trigger('parseComplete')
            }
          }
  
          list.handlers.parseComplete = list.handlers.parseComplete || []
  
          return function () {
            var itemsToIndex = getChildren(list.list),
              valueNames = list.valueNames
  
            if (list.indexAsync) {
              parseAsync(itemsToIndex, valueNames)
            } else {
              parse(itemsToIndex, valueNames)
            }
          }
        }
  
      }, { "./item": 12 }], 15: [function (require, module, exports) {
        module.exports = function (list) {
          var item, text, columns, searchString, customSearch
  
          var prepare = {
            resetList: function () {
              list.i = 1
              list.templater.clear()
              customSearch = undefined
            },
            setOptions: function (args) {
              if (args.length == 2 && args[1] instanceof Array) {
                columns = args[1]
              } else if (args.length == 2 && typeof args[1] == 'function') {
                columns = undefined
                customSearch = args[1]
              } else if (args.length == 3) {
                columns = args[1]
                customSearch = args[2]
              } else {
                columns = undefined
              }
            },
            setColumns: function () {
              if (list.items.length === 0) return
              if (columns === undefined) {
                columns = list.searchColumns === undefined ? prepare.toArray(list.items[0].values()) : list.searchColumns
              }
            },
            setSearchString: function (s) {
              s = list.utils.toString(s).toLowerCase()
              s = s.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&') // Escape regular expression characters
              searchString = s
            },
            toArray: function (values) {
              var tmpColumn = []
              for (var name in values) {
                tmpColumn.push(name)
              }
              return tmpColumn
            },
          }
          var search = {
            list: function () {
              // Extract quoted phrases "word1 word2" from original searchString
              // searchString is converted to lowercase by List.js
              var words = [],
                phrase,
                ss = searchString
              while ((phrase = ss.match(/"([^"]+)"/)) !== null) {
                words.push(phrase[1])
                ss = ss.substring(0, phrase.index) + ss.substring(phrase.index + phrase[0].length)
              }
              // Get remaining space-separated words (if any)
              ss = ss.trim()
              if (ss.length) words = words.concat(ss.split(/\s+/))
              for (var k = 0, kl = list.items.length; k < kl; k++) {
                var item = list.items[k]
                item.found = false
                if (!words.length) continue
                for (var i = 0, il = words.length; i < il; i++) {
                  var word_found = false
                  for (var j = 0, jl = columns.length; j < jl; j++) {
                    var values = item.values(),
                      column = columns[j]
                    if (values.hasOwnProperty(column) && values[column] !== undefined && values[column] !== null) {
                      var text = typeof values[column] !== 'string' ? values[column].toString() : values[column]
                      if (text.toLowerCase().indexOf(words[i]) !== -1) {
                        // word found, so no need to check it against any other columns
                        word_found = true
                        break
                      }
                    }
                  }
                  // this word not found? no need to check any other words, the item cannot match
                  if (!word_found) break
                }
                item.found = word_found
              }
            },
            // Removed search.item() and search.values()
            reset: function () {
              list.reset.search()
              list.searched = false
            },
          }
  
          var searchMethod = function (str) {
            list.trigger('searchStart')
  
            prepare.resetList()
            prepare.setSearchString(str)
            prepare.setOptions(arguments) // str, cols|searchFunction, searchFunction
            prepare.setColumns()
  
            if (searchString === '') {
              search.reset()
            } else {
              list.searched = true
              if (customSearch) {
                customSearch(searchString, columns)
              } else {
                search.list()
              }
            }
  
            list.update()
            list.trigger('searchComplete')
            return list.visibleItems
          }
  
          list.handlers.searchStart = list.handlers.searchStart || []
          list.handlers.searchComplete = list.handlers.searchComplete || []
  
          list.utils.events.bind(
            list.utils.getByClass(list.listContainer, list.searchClass),
            'keyup',
            list.utils.events.debounce(function (e) {
              var target = e.target || e.srcElement, // IE have srcElement
                alreadyCleared = target.value === '' && !list.searched
              if (!alreadyCleared) {
                // If oninput already have resetted the list, do nothing
                searchMethod(target.value)
              }
            }, list.searchDelay)
          )
  
          // Used to detect click on HTML5 clear button
          list.utils.events.bind(list.utils.getByClass(list.listContainer, list.searchClass), 'input', function (e) {
            var target = e.target || e.srcElement
            if (target.value === '') {
              searchMethod('')
            }
          })
  
          return searchMethod
        }
  
      }, {}], 16: [function (require, module, exports) {
        module.exports = function (list) {
          var buttons = {
            els: undefined,
            clear: function () {
              for (var i = 0, il = buttons.els.length; i < il; i++) {
                list.utils.classes(buttons.els[i]).remove('asc')
                list.utils.classes(buttons.els[i]).remove('desc')
              }
            },
            getOrder: function (btn) {
              var predefinedOrder = list.utils.getAttribute(btn, 'data-order')
              if (predefinedOrder == 'asc' || predefinedOrder == 'desc') {
                return predefinedOrder
              } else if (list.utils.classes(btn).has('desc')) {
                return 'asc'
              } else if (list.utils.classes(btn).has('asc')) {
                return 'desc'
              } else {
                return 'asc'
              }
            },
            getInSensitive: function (btn, options) {
              var insensitive = list.utils.getAttribute(btn, 'data-insensitive')
              if (insensitive === 'false') {
                options.insensitive = false
              } else {
                options.insensitive = true
              }
            },
            setOrder: function (options) {
              for (var i = 0, il = buttons.els.length; i < il; i++) {
                var btn = buttons.els[i]
                if (list.utils.getAttribute(btn, 'data-sort') !== options.valueName) {
                  continue
                }
                var predefinedOrder = list.utils.getAttribute(btn, 'data-order')
                if (predefinedOrder == 'asc' || predefinedOrder == 'desc') {
                  if (predefinedOrder == options.order) {
                    list.utils.classes(btn).add(options.order)
                  }
                } else {
                  list.utils.classes(btn).add(options.order)
                }
              }
            },
          }
  
          var sort = function () {
            list.trigger('sortStart')
            var options = {}
  
            var target = arguments[0].currentTarget || arguments[0].srcElement || undefined
  
            if (target) {
              options.valueName = list.utils.getAttribute(target, 'data-sort')
              buttons.getInSensitive(target, options)
              options.order = buttons.getOrder(target)
            } else {
              options = arguments[1] || options
              options.valueName = arguments[0]
              options.order = options.order || 'asc'
              options.insensitive = typeof options.insensitive == 'undefined' ? true : options.insensitive
            }
  
            buttons.clear()
            buttons.setOrder(options)
  
            // caseInsensitive
            // alphabet
            var customSortFunction = options.sortFunction || list.sortFunction || null,
              multi = options.order === 'desc' ? -1 : 1,
              sortFunction
  
            if (customSortFunction) {
              sortFunction = function (itemA, itemB) {
                return customSortFunction(itemA, itemB, options) * multi
              }
            } else {
              sortFunction = function (itemA, itemB) {
                var sort = list.utils.naturalSort
                sort.alphabet = list.alphabet || options.alphabet || undefined
                if (!sort.alphabet && options.insensitive) {
                  sort = list.utils.naturalSort.caseInsensitive
                }
                return sort(itemA.values()[options.valueName], itemB.values()[options.valueName]) * multi
              }
            }
  
            list.items.sort(sortFunction)
            list.update()
            list.trigger('sortComplete')
          }
  
          // Add handlers
          list.handlers.sortStart = list.handlers.sortStart || []
          list.handlers.sortComplete = list.handlers.sortComplete || []
  
          buttons.els = list.utils.getByClass(list.listContainer, list.sortClass)
          list.utils.events.bind(buttons.els, 'click', sort)
          list.on('searchStart', buttons.clear)
          list.on('filterStart', buttons.clear)
  
          return sort
        }
  
      }, {}], 17: [function (require, module, exports) {
        var Templater = function (list) {
          var createItem,
            templater = this
  
          var init = function () {
            var itemSource
  
            if (typeof list.item === 'function') {
              createItem = function (values) {
                var item = list.item(values)
                return getItemSource(item)
              }
              return
            }
  
            if (typeof list.item === 'string') {
              if (list.item.indexOf('<') === -1) {
                itemSource = document.getElementById(list.item)
              } else {
                itemSource = getItemSource(list.item)
              }
            } else {
              /* If item source does not exists, use the first item in list as
              source for new items */
              itemSource = getFirstListItem()
            }
  
            if (!itemSource) {
              throw new Error("The list needs to have at least one item on init otherwise you'll have to add a template.")
            }
  
            itemSource = createCleanTemplateItem(itemSource, list.valueNames)
  
            createItem = function () {
              return itemSource.cloneNode(true)
            }
          }
  
          var createCleanTemplateItem = function (templateNode, valueNames) {
            var el = templateNode.cloneNode(true)
            el.removeAttribute('id')
  
            for (var i = 0, il = valueNames.length; i < il; i++) {
              var elm = undefined,
                valueName = valueNames[i]
              if (valueName.data) {
                for (var j = 0, jl = valueName.data.length; j < jl; j++) {
                  el.setAttribute('data-' + valueName.data[j], '')
                }
              } else if (valueName.attr && valueName.name) {
                elm = list.utils.getByClass(el, valueName.name, true)
                if (elm) {
                  elm.setAttribute(valueName.attr, '')
                }
              } else {
                elm = list.utils.getByClass(el, valueName, true)
                if (elm) {
                  elm.innerHTML = ''
                }
              }
            }
            return el
          }
  
          var getFirstListItem = function () {
            var nodes = list.list.childNodes
  
            for (var i = 0, il = nodes.length; i < il; i++) {
              // Only textnodes have a data attribute
              if (nodes[i].data === undefined) {
                return nodes[i].cloneNode(true)
              }
            }
            return undefined
          }
  
          var getItemSource = function (itemHTML) {
            if (typeof itemHTML !== 'string') return undefined
            if (/<tr[\s>]/g.exec(itemHTML)) {
              var tbody = document.createElement('tbody')
              tbody.innerHTML = itemHTML
              return tbody.firstElementChild
            } else if (itemHTML.indexOf('<') !== -1) {
              var div = document.createElement('div')
              div.innerHTML = itemHTML
              return div.firstElementChild
            }
            return undefined
          }
  
          var getValueName = function (name) {
            for (var i = 0, il = list.valueNames.length; i < il; i++) {
              var valueName = list.valueNames[i]
              if (valueName.data) {
                var data = valueName.data
                for (var j = 0, jl = data.length; j < jl; j++) {
                  if (data[j] === name) {
                    return { data: name }
                  }
                }
              } else if (valueName.attr && valueName.name && valueName.name == name) {
                return valueName
              } else if (valueName === name) {
                return name
              }
            }
          }
  
          var setValue = function (item, name, value) {
            var elm = undefined,
              valueName = getValueName(name)
            if (!valueName) return
            if (valueName.data) {
              item.elm.setAttribute('data-' + valueName.data, value)
            } else if (valueName.attr && valueName.name) {
              elm = list.utils.getByClass(item.elm, valueName.name, true)
              if (elm) {
                elm.setAttribute(valueName.attr, value)
              }
            } else {
              elm = list.utils.getByClass(item.elm, valueName, true)
              if (elm) {
                elm.innerHTML = value
              }
            }
          }
  
          this.get = function (item, valueNames) {
            templater.create(item)
            var values = {}
            for (var i = 0, il = valueNames.length; i < il; i++) {
              var elm = undefined,
                valueName = valueNames[i]
              if (valueName.data) {
                for (var j = 0, jl = valueName.data.length; j < jl; j++) {
                  values[valueName.data[j]] = list.utils.getAttribute(item.elm, 'data-' + valueName.data[j])
                }
              } else if (valueName.attr && valueName.name) {
                elm = list.utils.getByClass(item.elm, valueName.name, true)
                values[valueName.name] = elm ? list.utils.getAttribute(elm, valueName.attr) : ''
              } else {
                elm = list.utils.getByClass(item.elm, valueName, true)
                values[valueName] = elm ? elm.innerHTML : ''
              }
            }
            return values
          }
  
          this.set = function (item, values) {
            if (!templater.create(item)) {
              for (var v in values) {
                if (values.hasOwnProperty(v)) {
                  setValue(item, v, values[v])
                }
              }
            }
          }
  
          this.create = function (item) {
            if (item.elm !== undefined) {
              return false
            }
            item.elm = createItem(item.values())
            templater.set(item, item.values())
            return true
          }
          this.remove = function (item) {
            if (item.elm.parentNode === list.list) {
              list.list.removeChild(item.elm)
            }
          }
          this.show = function (item) {
            templater.create(item)
            list.list.appendChild(item.elm)
          }
          this.hide = function (item) {
            if (item.elm !== undefined && item.elm.parentNode === list.list) {
              list.list.removeChild(item.elm)
            }
          }
          this.clear = function () {
            /* .innerHTML = ''; fucks up IE */
            if (list.list.hasChildNodes()) {
              while (list.list.childNodes.length >= 1) {
                list.list.removeChild(list.list.firstChild)
              }
            }
          }
  
          init()
        }
  
        module.exports = function (list) {
          return new Templater(list)
        }
  
      }, {}], 18: [function (require, module, exports) {
        /**
         * Module dependencies.
         */
  
        var index = require('./index-of')
  
        /**
         * Whitespace regexp.
         */
  
        var re = /\s+/
  
        /**
         * toString reference.
         */
  
        var toString = Object.prototype.toString
  
        /**
         * Wrap `el` in a `ClassList`.
         *
         * @param {Element} el
         * @return {ClassList}
         * @api public
         */
  
        module.exports = function (el) {
          return new ClassList(el)
        }
  
        /**
         * Initialize a new ClassList for `el`.
         *
         * @param {Element} el
         * @api private
         */
  
        function ClassList(el) {
          if (!el || !el.nodeType) {
            throw new Error('A DOM element reference is required')
          }
          this.el = el
          this.list = el.classList
        }
  
        /**
         * Add class `name` if not already present.
         *
         * @param {String} name
         * @return {ClassList}
         * @api public
         */
  
        ClassList.prototype.add = function (name) {
          // classList
          if (this.list) {
            this.list.add(name)
            return this
          }
  
          // fallback
          var arr = this.array()
          var i = index(arr, name)
          if (!~i) arr.push(name)
          this.el.className = arr.join(' ')
          return this
        }
  
        /**
         * Remove class `name` when present, or
         * pass a regular expression to remove
         * any which match.
         *
         * @param {String|RegExp} name
         * @return {ClassList}
         * @api public
         */
  
        ClassList.prototype.remove = function (name) {
          // classList
          if (this.list) {
            this.list.remove(name)
            return this
          }
  
          // fallback
          var arr = this.array()
          var i = index(arr, name)
          if (~i) arr.splice(i, 1)
          this.el.className = arr.join(' ')
          return this
        }
  
        /**
         * Toggle class `name`, can force state via `force`.
         *
         * For browsers that support classList, but do not support `force` yet,
         * the mistake will be detected and corrected.
         *
         * @param {String} name
         * @param {Boolean} force
         * @return {ClassList}
         * @api public
         */
  
        ClassList.prototype.toggle = function (name, force) {
          // classList
          if (this.list) {
            if ('undefined' !== typeof force) {
              if (force !== this.list.toggle(name, force)) {
                this.list.toggle(name) // toggle again to correct
              }
            } else {
              this.list.toggle(name)
            }
            return this
          }
  
          // fallback
          if ('undefined' !== typeof force) {
            if (!force) {
              this.remove(name)
            } else {
              this.add(name)
            }
          } else {
            if (this.has(name)) {
              this.remove(name)
            } else {
              this.add(name)
            }
          }
  
          return this
        }
  
        /**
         * Return an array of classes.
         *
         * @return {Array}
         * @api public
         */
  
        ClassList.prototype.array = function () {
          var className = this.el.getAttribute('class') || ''
          var str = className.replace(/^\s+|\s+$/g, '')
          var arr = str.split(re)
          if ('' === arr[0]) arr.shift()
          return arr
        }
  
        /**
         * Check if class `name` is present.
         *
         * @param {String} name
         * @return {ClassList}
         * @api public
         */
  
        ClassList.prototype.has = ClassList.prototype.contains = function (name) {
          return this.list ? this.list.contains(name) : !!~index(this.array(), name)
        }
  
      }, { "./index-of": 24 }], 19: [function (require, module, exports) {
        var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
          unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
          prefix = bind !== 'addEventListener' ? 'on' : '',
          toArray = require('./to-array')
  
        /**
         * Bind `el` event `type` to `fn`.
         *
         * @param {Element} el, NodeList, HTMLCollection or Array
         * @param {String} type
         * @param {Function} fn
         * @param {Boolean} capture
         * @api public
         */
  
        exports.bind = function (el, type, fn, capture) {
          el = toArray(el)
          for (var i = 0, il = el.length; i < il; i++) {
            el[i][bind](prefix + type, fn, capture || false)
          }
        }
  
        /**
         * Unbind `el` event `type`'s callback `fn`.
         *
         * @param {Element} el, NodeList, HTMLCollection or Array
         * @param {String} type
         * @param {Function} fn
         * @param {Boolean} capture
         * @api public
         */
  
        exports.unbind = function (el, type, fn, capture) {
          el = toArray(el)
          for (var i = 0, il = el.length; i < il; i++) {
            el[i][unbind](prefix + type, fn, capture || false)
          }
        }
  
        /**
         * Returns a function, that, as long as it continues to be invoked, will not
         * be triggered. The function will be called after it stops being called for
         * `wait` milliseconds. If `immediate` is true, trigger the function on the
         * leading edge, instead of the trailing.
         *
         * @param {Function} fn
         * @param {Integer} wait
         * @param {Boolean} immediate
         * @api public
         */
  
        exports.debounce = function (fn, wait, immediate) {
          var timeout
          return wait
            ? function () {
              var context = this,
                args = arguments
              var later = function () {
                timeout = null
                if (!immediate) fn.apply(context, args)
              }
              var callNow = immediate && !timeout
              clearTimeout(timeout)
              timeout = setTimeout(later, wait)
              if (callNow) fn.apply(context, args)
            }
            : fn
        }
  
      }, { "./to-array": 25 }], 20: [function (require, module, exports) {
        /*
         * Source: https://github.com/segmentio/extend
         */
  
        module.exports = function extend(object) {
          // Takes an unlimited number of extenders.
          var args = Array.prototype.slice.call(arguments, 1)
  
          // For each extender, copy their properties on our object.
          for (var i = 0, source; (source = args[i]); i++) {
            if (!source) continue
            for (var property in source) {
              object[property] = source[property]
            }
          }
  
          return object
        }
  
      }, {}], 21: [function (require, module, exports) {
        module.exports = function (text, pattern, options) {
          // Aproximately where in the text is the pattern expected to be found?
          var Match_Location = options.location || 0
  
          //Determines how close the match must be to the fuzzy location (specified above). An exact letter match which is 'distance' characters away from the fuzzy location would score as a complete mismatch. A distance of '0' requires the match be at the exact location specified, a threshold of '1000' would require a perfect match to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
          var Match_Distance = options.distance || 100
  
          // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match (of both letters and location), a threshold of '1.0' would match anything.
          var Match_Threshold = options.threshold || 0.4
  
          if (pattern === text) return true // Exact match
          if (pattern.length > 32) return false // This algorithm cannot be used
  
          // Set starting location at beginning text and initialise the alphabet.
          var loc = Match_Location,
            s = (function () {
              var q = {},
                i
  
              for (i = 0; i < pattern.length; i++) {
                q[pattern.charAt(i)] = 0
              }
  
              for (i = 0; i < pattern.length; i++) {
                q[pattern.charAt(i)] |= 1 << (pattern.length - i - 1)
              }
  
              return q
            })()
  
          // Compute and return the score for a match with e errors and x location.
          // Accesses loc and pattern through being a closure.
  
          function match_bitapScore_(e, x) {
            var accuracy = e / pattern.length,
              proximity = Math.abs(loc - x)
  
            if (!Match_Distance) {
              // Dodge divide by zero error.
              return proximity ? 1.0 : accuracy
            }
            return accuracy + proximity / Match_Distance
          }
  
          var score_threshold = Match_Threshold, // Highest score beyond which we give up.
            best_loc = text.indexOf(pattern, loc) // Is there a nearby exact match? (speedup)
  
          if (best_loc != -1) {
            score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold)
            // What about in the other direction? (speedup)
            best_loc = text.lastIndexOf(pattern, loc + pattern.length)
  
            if (best_loc != -1) {
              score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold)
            }
          }
  
          // Initialise the bit arrays.
          var matchmask = 1 << (pattern.length - 1)
          best_loc = -1
  
          var bin_min, bin_mid
          var bin_max = pattern.length + text.length
          var last_rd
          for (var d = 0; d < pattern.length; d++) {
            // Scan for the best match; each iteration allows for one more error.
            // Run a binary search to determine how far from 'loc' we can stray at this
            // error level.
            bin_min = 0
            bin_mid = bin_max
            while (bin_min < bin_mid) {
              if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
                bin_min = bin_mid
              } else {
                bin_max = bin_mid
              }
              bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min)
            }
            // Use the result from this iteration as the maximum for the next.
            bin_max = bin_mid
            var start = Math.max(1, loc - bin_mid + 1)
            var finish = Math.min(loc + bin_mid, text.length) + pattern.length
  
            var rd = Array(finish + 2)
            rd[finish + 1] = (1 << d) - 1
            for (var j = finish; j >= start; j--) {
              // The alphabet (s) is a sparse hash, so the following line generates
              // warnings.
              var charMatch = s[text.charAt(j - 1)]
              if (d === 0) {
                // First pass: exact match.
                rd[j] = ((rd[j + 1] << 1) | 1) & charMatch
              } else {
                // Subsequent passes: fuzzy match.
                rd[j] = (((rd[j + 1] << 1) | 1) & charMatch) | (((last_rd[j + 1] | last_rd[j]) << 1) | 1) | last_rd[j + 1]
              }
              if (rd[j] & matchmask) {
                var score = match_bitapScore_(d, j - 1)
                // This match will almost certainly be better than any existing match.
                // But check anyway.
                if (score <= score_threshold) {
                  // Told you so.
                  score_threshold = score
                  best_loc = j - 1
                  if (best_loc > loc) {
                    // When passing loc, don't exceed our current distance from loc.
                    start = Math.max(1, 2 * loc - best_loc)
                  } else {
                    // Already passed loc, downhill from here on in.
                    break
                  }
                }
              }
            }
            // No hope for a (better) match at greater error levels.
            if (match_bitapScore_(d + 1, loc) > score_threshold) {
              break
            }
            last_rd = rd
          }
  
          return best_loc < 0 ? false : true
        }
  
      }, {}], 22: [function (require, module, exports) {
        /**
         * A cross-browser implementation of getAttribute.
         * Source found here: http://stackoverflow.com/a/3755343/361337 written by Vivin Paliath
         *
         * Return the value for `attr` at `element`.
         *
         * @param {Element} el
         * @param {String} attr
         * @api public
         */
  
        module.exports = function (el, attr) {
          var result = (el.getAttribute && el.getAttribute(attr)) || null
          if (!result) {
            var attrs = el.attributes
            var length = attrs.length
            for (var i = 0; i < length; i++) {
              if (attrs[i] !== undefined) {
                if (attrs[i].nodeName === attr) {
                  result = attrs[i].nodeValue
                }
              }
            }
          }
          return result
        }
  
      }, {}], 23: [function (require, module, exports) {
        /**
         * A cross-browser implementation of getElementsByClass.
         * Heavily based on Dustin Diaz's function: http://dustindiaz.com/getelementsbyclass.
         *
         * Find all elements with class `className` inside `container`.
         * Use `single = true` to increase performance in older browsers
         * when only one element is needed.
         *
         * @param {String} className
         * @param {Element} container
         * @param {Boolean} single
         * @api public
         */
  
        var getElementsByClassName = function (container, className, single) {
          if (single) {
            return container.getElementsByClassName(className)[0]
          } else {
            return container.getElementsByClassName(className)
          }
        }
  
        var querySelector = function (container, className, single) {
          className = '.' + className
          if (single) {
            return container.querySelector(className)
          } else {
            return container.querySelectorAll(className)
          }
        }
  
        var polyfill = function (container, className, single) {
          var classElements = [],
            tag = '*'
  
          var els = container.getElementsByTagName(tag)
          var elsLen = els.length
          var pattern = new RegExp('(^|\\s)' + className + '(\\s|$)')
          for (var i = 0, j = 0; i < elsLen; i++) {
            if (pattern.test(els[i].className)) {
              if (single) {
                return els[i]
              } else {
                classElements[j] = els[i]
                j++
              }
            }
          }
          return classElements
        }
  
        module.exports = (function () {
          return function (container, className, single, options) {
            options = options || {}
            if ((options.test && options.getElementsByClassName) || (!options.test && document.getElementsByClassName)) {
              return getElementsByClassName(container, className, single)
            } else if ((options.test && options.querySelector) || (!options.test && document.querySelector)) {
              return querySelector(container, className, single)
            } else {
              return polyfill(container, className, single)
            }
          }
        })()
  
      }, {}], 24: [function (require, module, exports) {
        var indexOf = [].indexOf
  
        module.exports = function (arr, obj) {
          if (indexOf) return arr.indexOf(obj);
          for (var i = 0, il = arr.length; i < il; ++i) {
            if (arr[i] === obj) return i;
          }
          return -1
        }
  
      }, {}], 25: [function (require, module, exports) {
        /**
         * Source: https://github.com/timoxley/to-array
         *
         * Convert an array-like object into an `Array`.
         * If `collection` is already an `Array`, then will return a clone of `collection`.
         *
         * @param {Array | Mixed} collection An `Array` or array-like object to convert e.g. `arguments` or `NodeList`
         * @return {Array} Naive conversion of `collection` to a new `Array`.
         * @api public
         */
  
        module.exports = function toArray(collection) {
          if (typeof collection === 'undefined') return []
          if (collection === null) return [null]
          if (collection === window) return [window]
          if (typeof collection === 'string') return [collection]
          if (isArray(collection)) return collection
          if (typeof collection.length != 'number') return [collection]
          if (typeof collection === 'function' && collection instanceof Function) return [collection]
  
          var arr = [];
          for (var i = 0, il = collection.length; i < il; i++) {
            if (Object.prototype.hasOwnProperty.call(collection, i) || i in collection) {
              arr.push(collection[i])
            }
          }
          if (!arr.length) return []
          return arr
        }
  
        function isArray(arr) {
          return Object.prototype.toString.call(arr) === '[object Array]'
        }
  
      }, {}], 26: [function (require, module, exports) {
        module.exports = function (s) {
          s = s === undefined ? '' : s
          s = s === null ? '' : s
          s = s.toString()
          return s
        }
  
      }, {}], 27: [function (require, module, exports) {
        'use strict';
  
        var alphabet;
        var alphabetIndexMap;
        var alphabetIndexMapLength = 0;
  
        function isNumberCode(code) {
          return code >= 48 && code <= 57;
        }
  
        function naturalCompare(a, b) {
          var lengthA = (a += '').length;
          var lengthB = (b += '').length;
          var aIndex = 0;
          var bIndex = 0;
  
          while (aIndex < lengthA && bIndex < lengthB) {
            var charCodeA = a.charCodeAt(aIndex);
            var charCodeB = b.charCodeAt(bIndex);
  
            if (isNumberCode(charCodeA)) {
              if (!isNumberCode(charCodeB)) {
                return charCodeA - charCodeB;
              }
  
              var numStartA = aIndex;
              var numStartB = bIndex;
  
              while (charCodeA === 48 && ++numStartA < lengthA) {
                charCodeA = a.charCodeAt(numStartA);
              }
              while (charCodeB === 48 && ++numStartB < lengthB) {
                charCodeB = b.charCodeAt(numStartB);
              }
  
              var numEndA = numStartA;
              var numEndB = numStartB;
  
              while (numEndA < lengthA && isNumberCode(a.charCodeAt(numEndA))) {
                ++numEndA;
              }
              while (numEndB < lengthB && isNumberCode(b.charCodeAt(numEndB))) {
                ++numEndB;
              }
  
              var difference = numEndA - numStartA - numEndB + numStartB; // numA length - numB length
              if (difference) {
                return difference;
              }
  
              while (numStartA < numEndA) {
                difference = a.charCodeAt(numStartA++) - b.charCodeAt(numStartB++);
                if (difference) {
                  return difference;
                }
              }
  
              aIndex = numEndA;
              bIndex = numEndB;
              continue;
            }
  
            if (charCodeA !== charCodeB) {
              if (
                charCodeA < alphabetIndexMapLength &&
                charCodeB < alphabetIndexMapLength &&
                alphabetIndexMap[charCodeA] !== -1 &&
                alphabetIndexMap[charCodeB] !== -1
              ) {
                return alphabetIndexMap[charCodeA] - alphabetIndexMap[charCodeB];
              }
  
              return charCodeA - charCodeB;
            }
  
            ++aIndex;
            ++bIndex;
          }
  
          if (aIndex >= lengthA && bIndex < lengthB && lengthA >= lengthB) {
            return -1;
          }
  
          if (bIndex >= lengthB && aIndex < lengthA && lengthB >= lengthA) {
            return 1;
          }
  
          return lengthA - lengthB;
        }
  
        naturalCompare.caseInsensitive = naturalCompare.i = function (a, b) {
          return naturalCompare(('' + a).toLowerCase(), ('' + b).toLowerCase());
        };
  
        Object.defineProperties(naturalCompare, {
          alphabet: {
            get: function () {
              return alphabet;
            },
  
            set: function (value) {
              alphabet = value;
              alphabetIndexMap = [];
  
              var i = 0;
  
              if (alphabet) {
                for (; i < alphabet.length; i++) {
                  alphabetIndexMap[alphabet.charCodeAt(i)] = i;
                }
              }
  
              alphabetIndexMapLength = alphabetIndexMap.length;
  
              for (i = 0; i < alphabetIndexMapLength; i++) {
                if (alphabetIndexMap[i] === undefined) {
                  alphabetIndexMap[i] = -1;
                }
              }
            },
          },
        });
  
        module.exports = naturalCompare;
  
      }, {}],
      28: [function (require, module, exports) {
        !function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).dayjs_plugin_timezone=e()}(this,function(){"use strict";var s={year:0,month:1,day:2,hour:3,minute:4,second:5},m={};return function(t,e,a){function f(t,e,n){void 0===n&&(n={});var i,o,t=new Date(t);return n=(void 0===n?{}:n).timeZoneName||"short",(o=m[i=e+"|"+n])||(o=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:n}),m[i]=o),o.formatToParts(t)}function r(t,e){for(var n=f(t,e),i=[],o=0;o<n.length;o+=1){var r=n[o],u=r.type,r=r.value,u=s[u];0<=u&&(i[u]=parseInt(r,10))}return e=i[3],e=i[0]+"-"+i[1]+"-"+i[2]+" "+(24===e?0:e)+":"+i[4]+":"+i[5]+":000",t=+t,(a.utc(e).valueOf()-(t-t%1e3))/6e4}var u,e=e.prototype,i=(e.tz=function(t,e){void 0===t&&(t=u);var n=this.utcOffset(),i=this.toDate(),o=i.toLocaleString("en-US",{timeZone:t}),r=Math.round((i-new Date(o))/1e3/60),o=a(o).$set("millisecond",this.$ms).utcOffset(15*-Math.round(i.getTimezoneOffset()/15)-r,!0);return e&&(i=o.utcOffset(),o=o.add(n-i,"minute")),o.$x.$timezone=t,o},e.offsetName=function(t){var e=this.$x.$timezone||a.tz.guess(),e=f(this.valueOf(),e,{timeZoneName:t}).find(function(t){return"timezonename"===t.type.toLowerCase()});return e&&e.value},e.startOf);e.startOf=function(t,e){if(!this.$x||!this.$x.$timezone)return i.call(this,t,e);var n=a(this.format("YYYY-MM-DD HH:mm:ss:SSS"));return i.call(n,t,e).tz(this.$x.$timezone,!0)},a.tz=function(t,e,n){var i=n&&e,n=n||e||u,e=r(+a(),n);if("string"!=typeof t)return a(t).tz(n);t=function(t,e,n){var i=t-60*e*1e3,o=r(i,n);if(e===o)return[i,e];e=r(i-=60*(o-e)*1e3,n);return o===e?[i,o]:[t-60*Math.min(o,e)*1e3,Math.max(o,e)]}(a.utc(t,i).valueOf(),e,n),i=t[0],e=t[1],t=a(i).utcOffset(e);return t.$x.$timezone=n,t},a.tz.guess=function(){return Intl.DateTimeFormat().resolvedOptions().timeZone},a.tz.setDefault=function(t){u=t}}});
      }, {}],
      29: [function (require, module, exports) {
        !function(t,i){"object"==typeof exports&&"undefined"!=typeof module?module.exports=i():"function"==typeof define&&define.amd?define(i):(t="undefined"!=typeof globalThis?globalThis:t||self).dayjs_plugin_utc=i()}(this,function(){"use strict";var a="minute",c=/[+-]\d\d(?::?\d\d)?/g,l=/([+-]|\d\d)/g;return function(t,i,f){var s=i.prototype,e=(f.utc=function(t){return new i({date:t,utc:!0,args:arguments})},s.utc=function(t){var i=f(this.toDate(),{locale:this.$L,utc:!0});return t?i.add(this.utcOffset(),a):i},s.local=function(){return f(this.toDate(),{locale:this.$L,utc:!1})},s.parse),n=(s.parse=function(t){t.utc&&(this.$u=!0),this.$utils().u(t.$offset)||(this.$offset=t.$offset),e.call(this,t)},s.init),u=(s.init=function(){var t;this.$u?(t=this.$d,this.$y=t.getUTCFullYear(),this.$M=t.getUTCMonth(),this.$D=t.getUTCDate(),this.$W=t.getUTCDay(),this.$H=t.getUTCHours(),this.$m=t.getUTCMinutes(),this.$s=t.getUTCSeconds(),this.$ms=t.getUTCMilliseconds()):n.call(this)},s.utcOffset),o=(s.utcOffset=function(s,t){var i=this.$utils().u;if(i(s))return this.$u?0:i(this.$offset)?u.call(this):this.$offset;if("string"==typeof s&&null===(s=function(){var t=(void 0===s?"":s).match(c);if(!t)return null;var t=(""+t[0]).match(l)||["-",0,0],i=t[0],t=60*+t[1]+ +t[2];return 0==t?0:"+"===i?t:-t}()))return this;var i=Math.abs(s)<=16?60*s:s,e=this;return t?(e.$offset=i,e.$u=0===s):0!==s?(t=this.$u?this.toDate().getTimezoneOffset():-1*this.utcOffset(),(e=this.local().add(i+t,a)).$offset=i,e.$x.$localOffset=t):e=this.utc(),e},s.format),r=(s.format=function(t){t=t||(this.$u?"YYYY-MM-DDTHH:mm:ss[Z]":"");return o.call(this,t)},s.valueOf=function(){var t=this.$utils().u(this.$offset)?0:this.$offset+(this.$x.$localOffset||this.$d.getTimezoneOffset());return this.$d.valueOf()-6e4*t},s.isUTC=function(){return!!this.$u},s.toISOString=function(){return this.toDate().toISOString()},s.toString=function(){return this.toDate().toUTCString()},s.toDate),h=(s.toDate=function(t){return"s"===t&&this.$offset?f(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate():r.call(this)},s.diff);s.diff=function(t,i,s){if(t&&this.$u===t.$u)return h.call(this,t,i,s);var e=this.local(),t=f(t).local();return h.call(e,t,i,s)}}});      }, {}]
    }, {}, [1])(1)
  });
