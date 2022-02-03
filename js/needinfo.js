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
        "needinfo" : {
            "bugzilla_rest_url": "https://bugzilla.mozilla.org/rest/bug?",
            "fields_query" : "f1=requestees.login_name&o2=equals&v2=needinfo%3F&f2=flagtypes.name&o1=equals&v1={id}%40mozilla.com&include_fields=id,summary",
            "api_key" : "",
            "contestants" : {
                "Andrew" : "aosmond",
                "Jamie" : "jnicol",
                "Brad" : "bwerth",
                "Nical" : "nsilva",
                "Jeff" : "jmuizelaar",
                "Sotaro" : "sikeda",
                "JimM" : "jmathies",
                "JimB" : "jblandy",
                "Jon" : "jbauman",
                "Lee" : "lsalzman",
                "Bob" : "bhood",
                "Miko" : "mmynttinen",
                "Kelsey" : "jbilbert",
                "Glenn" : "gwatson",
                "Dzmitry" : "dmalyshau"
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

    for(var key in NEEDINFO.contestants) {
        var id = NEEDINFO.contestants[key]
        var url = NEEDINFO.bugzilla_rest_url;
        if(NEEDINFO.api_key.length) {
            url += "api_key=" + NEEDINFO.api_key + "&";
        }
        url += NEEDINFO.fields_query.replace("{id}", id);

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
                        + "<h5>(" + NEEDINFO.contestants[key] + "@mozilla.com)</h5>"
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
    $("#star_" + key).replaceWith(star);
    $("#data_" + key).replaceWith("<div id=\"data_" + key + "\" class=\"" + klass + "\">" + ni_count + "</div>");
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
