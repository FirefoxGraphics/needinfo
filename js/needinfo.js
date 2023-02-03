/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var NEEDINFO = null;
var POW = ["images/bang.png", "images/boom.png", "images/pow.png", "images/splat.png"];

$(document).ready(function () {
    $("#applySettingsButton").click(function() {
        var x = $("form").serializeArray();
        var values = {};
        $.each(x, function(i, field) {
            values[field.name] = field.value;
        });

        var close_settings = true;
        var use_local = JSON.stringify(values).includes("remember");

        // API key
        var old_api_key = "";
        var key = sessionStorage.getItem("api-key");
        if(key == null) {
            key = localStorage.getItem("api-key");
        }
        if(key != null) {
            old_api_key = key;
        }

        if(old_api_key != values.key) {
            if(use_local) {
                localStorage.setItem("api-key", values.key);
            } else {
                sessionStorage.setItem("api-key", values.key);
            }
            close = false;
        }

        if(close) {
            closeSettings();
        }
        else {
            window.location.reload(true);
        }
    });

    window.onclick = function (event) {
        var modal = document.getElementById('settingsPopup');
        if (event.target == modal) {
          closeForm();
        }
      }

    var data = {
        // example JSON: https://bugzilla.mozilla.org/rest/bug/1658986
        "needinfo" : {
            "bugzilla_rest_url": "https://bugzilla.mozilla.org/rest/bug?",
            "bugzilla_bug_list" : "https://bugzilla.mozilla.org/buglist.cgi?bug_id=",
            "fields_query" : "f1=requestees.login_name&o2=equals&v2=needinfo%3F&f2=flagtypes.name&o1=equals&v1={id}&include_fields=id,summary,severity",
            "api_key" : "",
            "contestants" : {
                "Jamie" : "jnicol@mozilla.com",
                "Brad" : "bwerth@mozilla.com",
                "Nical" : "nical.bugzilla@gmail.com",
                "Jeff" : "jmuizelaar@mozilla.com",
                "Sotaro" : "sotaro.ikeda.g@gmail.com",
                "JimM" : "jmathies@mozilla.com",
                "JimB" : "jimb@mozilla.com",
                "Jon" : "jbauman@mozilla.com",
                "Lee" : "lsalzman@mozilla.com",
                "Bob" : "bhood@mozilla.com",
                "Tim" : "tnikkel@gmail.com",
                "Kelsey" : "jgilbert@mozilla.com",
                "Glenn" : "gwatson@mozilla.com",
                "Ashley" : "ahale@mozilla.com",
                "Erich" : "egubler@mozilla.com",
                "Teo" : "ttanasoaia@mozilla.com"
            }
        }
    };

    main(data);

//     $.getJSON('js/needinfo.json', function(data) {
//     main(data);
//   });
});

function main(json)
{
    NEEDINFO = json.needinfo;

    var api_key = sessionStorage.getItem("api-key");
    if(api_key == null) {
        api_key = localStorage.getItem("api-key");
    }
    NEEDINFO.api_key = (api_key == null) ? "" : api_key;

    var s1 = Object.keys(NEEDINFO.contestants).length;
    $("#subtitle").replaceWith("<div id=\"subtitle\" class=\"subtitle\">Tracking " + s1 + " contestants</div>");
  
    prepPage(NEEDINFO.contestants.size, "current");

    for (var key in NEEDINFO.contestants) {
        var id = NEEDINFO.contestants[key];
        var url = NEEDINFO.bugzilla_rest_url;
        if(NEEDINFO.api_key.length) {
            url += "api_key=" + NEEDINFO.api_key + "&";
        }
        url += NEEDINFO.fields_query.replace("{id}", encodeURIComponent(id));

        retrieveInfoFor(url, key);
    }
}

// this function's sole reason for existing is to provide
// a capture context for the AJAX values...
function retrieveInfoFor(url, key)
{
    $.ajax({
        url: url,
        success: function(data) {
            displayCountFor(key, data);
        }
    })
    .error(function(jqXHR, textStatus, errorThrown) {
        console.log("error " + textStatus);
        console.log("incoming Text " + jqXHR.responseText);
    });
}

// generate random integer in the given range
function randomNumber(min, max) { 
    return Math.round(Math.random() * (max - min) + min);
}

function prepPage(count, displayType)
{
    $("#header-bg").attr("class", "header-bg header-bg-" + displayType);
    if (displayType != "current") {
        $("#title").attr("class", "title-light");
        $("#subtitle").attr("class", "subtitle title-light");
    }

    var content = "";
    for (var key in NEEDINFO.contestants) {
        content += "<div class=\"nicount\" id=\"reportDiv_" + key + "\"><h3>"
                        + "<span id=\"star_" + key + "\"></span>&nbsp;" + key 
                        + "</h3>"
                        + "<h5>(" + NEEDINFO.contestants[key] + ")</h5>"
                        + "<div id=\"data_" + key + "\""
                        + " class=\"data greyedout\">?</div></div>";
    }
    if(content.length) {
        $("#content").replaceWith(content);
    }
}

function displayCountFor(key, data)
{
    var ni_count = data.bugs.length;
    var klass = "data";
    if (NEEDINFO.api_key.length != 0){
        klass += "-validated";
    }
    var star = "";
    if (ni_count == 0) {
        var rand = randomNumber(0, 3);
        star = "<img id=\"gold-star\" src=\"" + POW[rand] + "\" width=\"30\">";
    }
    else if (ni_count < 5) {
        star = "<img id=\"gold-star\" src=\"images/runner-up.png\" width=\"30\">";
    }
    else if (ni_count > 100) {
        star = "<img id=\"gold-star\" src=\"images/knocked-out.png\" width=\"30\">";
    }

    var bug_link = "" + ni_count;
    if(ni_count != 0) {
        // build a Bugzilla "bug list" so clicking on the count will
        // take you to all your needinfos; e.g.
        // https://bugzilla.mozilla.org/buglist.cgi?bug_id=1680458%2C1695986%2C1732373

        var bug_list = NEEDINFO.bugzilla_bug_list;
        var severity_map = new Map();
        var bug_ids = "";
        for (var i = 0; i < data.bugs.length; ++i) {
            if(bug_ids.length != 0) {
                bug_ids += ",";
            }
            bug_ids += data.bugs[i].id;

            var severity = data.bugs[i].severity;
            var has_key = severity_map.has(severity);
            if (has_key == false) {
                severity_map.set(severity, new Array());
            }
            severity_map.get(severity).push(data.bugs[i].id);
        }
        bug_list += encodeURIComponent(bug_ids);
        bug_link = "<a href=\"" + bug_list + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + ni_count + "</a><font size=\"-1\"><table><tr><td colspan=\"5\"><hr/></td></tr>";

        // sort severities by (descneding) size
        var array = [];
        for (let [key, value] of severity_map) {
            array.push({name: key, value: value});
        }
        var sorted = array.sort(function(a, b) {
            return (a.value.length < b.value.length) ? 1 : ((b.value.length < a.value.length) ? -1 : 0)
        });
        var col = 0;
        bug_link += "<tr>";
        for (var i = 0;i < sorted.length; ++i) {
            var severity_list = NEEDINFO.bugzilla_bug_list;
            var severity_ids = "";
            for (var j = 0; j < sorted[i].value.length; ++j) {
                if(severity_ids.length != 0) {
                    severity_ids += ",";
                }
                severity_ids += sorted[i].value[j];
            }
            severity_list += encodeURIComponent(severity_ids);

            bug_link += "<td align=\"right\"><a href=\"" + severity_list + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + sorted[i].name + "</a> :</td><td align=\"left\"><a href=\"" + severity_list + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + sorted[i].value.length + "</a></td>";
            col += 1;
            if(col == 2) {
                bug_link += "</tr>";
                // are we done?
                if((i + 1) < sorted.length) {
                    // start a new row
                    bug_link += "<tr>";
                }
                col = 0;
            }
            else {
                bug_link += "<td>/</td>";
            }
        }
        if(col < 2) {
            bug_link += "</tr>";
        }
        bug_link += "</table></font>";
    }

    $("#star_" + key).replaceWith(star);
    $("#data_" + key).replaceWith("<div id=\"data_" + key + "\" class=\"" + klass + "\">" + bug_link + "</div>");
}

function openSettings() {
    if(NEEDINFO.api_key.length) {
        var api_key = document.getElementById("api-key");
        api_key.value = NEEDINFO.api_key;
    }

    document.getElementById("popupForm").style.display = "block";
}
  
function closeSettings() {
    document.getElementById("popupForm").style.display = "none";
}
