
//markdown editor
var SimpleMDE = null;
var simplemde;

async function initMarkdownEditor() {
    if (!SimpleMDE) {
        await loadScript("js/lib/mde/simplemde.1.11.2.min.js");
    }

    if (simplemde == null) {
        simplemde = new SimpleMDE({
            element: document.getElementById("newposttamemorandum"),
            autoDownloadFontAwesome: false,
            autosave: {
                enabled: true,
                uniqueId: "MyUniqueID",
                delay: 10000,
            },
            forceSync: true,
            promptURLs: true,
            spellChecker: false,
            showIcons: ["code", "table", "strikethrough", "heading-1", "heading-2", "heading-3", "quote"],
            hideIcons: ["preview", "side-by-side", "fullscreen", "guide", "heading"]
        });
        simplemde.codemirror.on("change", function () {
            memorandumPreview();
        });
    }
    memorandumPreview();

}

function getMemorandumText() {
    if(!simplemde){
        return '';
    }

    return simplemde.value();
}

var articlemode = false;
function switchToArticleMode(roottxid) {
    //changeStyle('base none', false);
    //'articleheader'+roottxid
    //document.querySelector('[id^="articleheader'+roottxid+'"]').innerHTML=document.querySelector('[id^="postbody'+roottxid+'"]').innerHTML;
    setBodyStyle("article");
    articlemode = true;
}

function switchToRegularMode() {
    if (articlemode) {
        //loadStyle();
        setBodyStyle("none");
        articlemode = false;
    }
}

function memorandumPreview() {
    if (document.getElementById('memorandumpreviewarea').style.display == 'none') {
        //Only run the preview if the preview area is visible
        return;
    }

    
    var time = new Date().getTime() / 1000;

    //Grab needed values from settings page
    var name = document.getElementById('settingsnametext').value;
    //var followers = document.getElementById('settingsfollowersnumber').innerHTML;
    //var following = document.getElementById('settingsfollowingnumber').innerHTML; 
    //var blockers = document.getElementById('settingsblockersnumber').innerHTML; 
    //var blocking = document.getElementById('settingsblockingnumber').innerHTML; 
    let followers = 0, following = 0, blockers = 0, blocking = 0;

    var pagingid = document.getElementById('settingspagingid').value;
    var profile = document.getElementById('settingsprofiletext').value;
    var publickey = document.getElementById('settingspublickey').value;
    var picurl = document.getElementById('settingspicurl').value;
    var tokens = document.getElementById('settingstokens').value;
    var nametime = document.getElementById('settingsnametime').value;
    var rating = document.getElementById('settingsrating').value;

    var isfollowing = true;

    var repostedHTML = document.getElementById('quotepost').outerHTML;



    document.getElementById('memorandumpreview').innerHTML =
        getHTMLForPostHTML('000', pubkey, name, 1, 0, 0, time, document.getElementById('memorandumtitle').value, '', '', 0, 0, null, "MAINRATINGID", '000', 1, 0, rating, 'preview', 0, '', pagingid, publickey, picurl, tokens, followers, following, blockers, blocking, profile, isfollowing, nametime, repostedHTML, 0, false)
        + `<div id="articleheader000" class="articleheader"></div>`
        + getHTMLForReplyHTML('000', pubkey, name, 1, 0, 0, time, getMemorandumText(), '', 'page', "MAINRATINGID", null, '000', 1, null, rating, 'preview', '', null, 0, '', pagingid, publickey, picurl, tokens, followers, following, blockers, blocking, profile, isfollowing, nametime, 0);

        //Repeat the title for article mode
    document.querySelector('[id^="articleheader000"]').innerHTML=document.querySelector('[id^="postbody000"]').innerHTML;

    addDynamicHTMLElements();
}

/*
function topictitleChanged() {

    //emojis are of length 4, although treated as length 2, so got to turn into hex to discover real length
    const titlelength = new Buffer(document.getElementById('memorandumtitle').value).toString('hex').length / 2;
    const topiclength = new Buffer(document.getElementById('memorandumtopic').value).toString('hex').length / 2;

    var maxlength = 217;
    if (topiclength) {
        maxlength -= 3;
    }
    if (document.getElementById('quotetxid').value) {
        maxlength -= 35;
    }

    document.getElementById('memorandumtitle').maxLength = Math.max(0, maxlength - topiclength);
    document.getElementById('memorandumtopic').maxLength = Math.max(0, maxlength - titlelength);
    document.getElementById('newpostmemorandumbutton').disabled = (topiclength + titlelength > maxlength);
    document.getElementById('memorandumtitlelengthadvice').innerHTML = "(" + titlelength + "/" + document.getElementById('memorandumtitle').maxLength + ")";
    document.getElementById('memorandumtopiclengthadvice').innerHTML = "(" + topiclength + "/" + document.getElementById('memorandumtopic').maxLength + ")";
}*/

function geopost() {
    if (!checkForPrivKey()) return false;

    var txtarea = document.getElementById('newgeopostta');
    var posttext = txtarea.value;
    if (posttext.length == 0) {
        alert(getSafeTranslation('nomessagebody', "No Message Body"));
        return false;
    }
    var lat = Number(document.getElementById("lat").value);
    var lon = Number(document.getElementById("lon").value);

    //Leaflet bug allow longitude values outside proper range
    while (lon < -180) {
        lon = lon + 180;
    }
    while (lon > 180) {
        lon = lon - 180;
    }
    var geohash = encodeGeoHash(lat, lon);


    document.getElementById('newpostgeocompleted').textContent = "";
    document.getElementById('newpostgeobutton').style.display = "none";
    document.getElementById('newpostgeostatus').style.display = "block";
    document.getElementById('newpostgeostatus').value = getSafeTranslation('posting', "Posting...");

    let successFunction = geocompleted;

    let taggedPostText=posttext + " \nhttps://member.cash/geotag/" + geohash;
    if (checkForNativeUserAndHasBalance()) {
        //postgeoRaw(posttext, privkey, geohash, "newpostgeostatus", successFunction);
        postmemorandumRaw(taggedPostText, '', privkey, '', "newpostgeostatus", successFunction, null);
        successFunction = null;
    }
    if (isBitCloutUser()) {
        sendBitCloutPost(posttext + " \nmember.cash/geotag/" + geohash, '', "newpostgeostatus", successFunction, { GeoHash: geohash });
    }

}

function postmemorandum() {
    if (!checkForPrivKey()) return false;
    var posttext = document.getElementById('memorandumtitle').value;
    var txid = document.getElementById('quotetxid').value;
    var postbody = document.getElementById('newposttamemorandum').value;
    //var topic = document.getElementById('memorandumtopic').value;

    var postLength=new Buffer(posttext).toString('hex').length/2;
    var bodyLength=new Buffer(postbody).toString('hex').length/2;
    if(postLength>20000){
        alert("Post size is "+postLength+". Maximum size of 20,000 chars exceeded. This can't be posted.");
        return;
    }
    if(bodyLength>20000){
        alert("Body size is "+bodyLength+". Maximum size of 20,000 chars exceeded. This can't be posted.");
        return;
    }

    var topic='';

    if (!txid) {
        if (posttext.length == 0) {
            alert(getSafeTranslation('nomemo', "No Memo - Try adding something in the memo box"));
            return false;
        }
    }/*else{
        if (posttext.length == 0 && topic.length == 0) {
            alert(getSafeTranslation('nopost',"No post or topic. Try a regular remember instead."));
            return false;
        }
    }*///nb allow empty remember for compact theme
    //topic may be empty string

    document.getElementById('newpostmemorandumcompleted').textContent = "";
    document.getElementById('newpostmemorandumbutton').style.display = "none";
    document.getElementById('newpostmemorandumstatus').style.display = "block";
    document.getElementById('newpostmemorandumstatus').value = getSafeTranslation('sendingtitle', "Sending Title...");

    var successFunction = memorandumpostcompleted;

    if (txid) {
        //Repost
        if (checkForNativeUserAndHasBalance()) {
            //quotepostRaw(posttext, privkey, topic, "newpostmemorandumstatus", function (txidnew) { sendRepostNotification(txid, "newpostmemorandumstatus", topic, txidnew); }, txid);
            postmemorandumRaw(posttext, '', privkey, topic, "newpostmemorandumstatus", function (txidnew) { sendRepostNotification(txid, "newpostmemorandumstatus", topic, txidnew); }, txid);
            successFunction = null;
        }
        if (isBitCloutUser()) {
            sendBitCloutQuotePost(posttext, topic, txid, "newpostmemorandumstatus", successFunction);
        }
    }
    else {
        //Don't post body if it is not visible - it may contain old elements that the user is not expecting to post
        if(document.getElementById('memorandumtextarea').style.display == 'none'){
            postbody='';
        }
        if (checkForNativeUserAndHasBalance()) {
            postmemorandumRaw(posttext, postbody, privkey, topic, "newpostmemorandumstatus", successFunction, null);
            successFunction = null;
        }
        if (isBitCloutUser()) {
            sendBitCloutPostLong(posttext, postbody, topic, "newpostmemorandumstatus", successFunction);
        }
    }

    //if (typeof popupOverlay !== "undefined") {
    //    popupOverlay.hide();
    //}
}

function sendRepostNotification(txid, divForStatus, topic, newtxid) {

    var replytext = getSafeTranslation('postremembered', "Your post was remembered");
    if (topic) {
        replytext += " " + getSafeTranslation('intopic', "in tag") + " " + topic;
    }
    replytext += " https://member.cash/p/" + newtxid.substr(0, 10);
    var replyHex = new Buffer(replytext).toString('hex');

    sendReplyRaw(privkey, txid, replyHex, 0, divForStatus, function (txidnew) { memorandumpostcompleted(newtxid); });
}

function memorandumpostcompleted(txid) {
    txid = san(txid);
    //document.getElementById('newpostmemorandumcompleted').innerHTML = `Sent. <a onclick="showThread('`+txid+`')" href="#thread?post=`+txid+`">View It</a> or  <a rel='noopener noreferrer' target="_blank" href="` + encodedURL + `">Also Post To Twitter (opens a new window)</a>`;
    document.getElementById('newpostmemorandumcompleted').innerHTML = completedPostHTML(txid, document.getElementById('memorandumtitle').value);
    //TODO - bit heavy to retranslate the whole page, maybe just translate the new element
    translatePage();

    /*
    var encodedURL = `https://twitter.com/intent/tweet?text=` + encodeURIComponent(document.getElementById('memorandumtitle').value + '\r\n' + ` member.cash/p/` + txid.substr(0, 10));
    `Sent. <a onclick="showThread('` + txid + `')" href="#thread?post=` + txid + `" onclick="nlc();">View It</a> or  <a href="" onclick="window.open('` + encodedURL + `', 'twitterwindow', 'width=300,height=250');return false;">Also Post To Twitter (opens a new window)</a>`;
    */
    //iframe not allowed by twitter
    //document.getElementById('newpostmemorandumcompleted').innerHTML = `Sent. <a rel='noopener noreferrer' onclick="createiframe('`+encodedURL+`','posttotwitter');return false;" href="">Also Post To Twitter</a><div id="posttotwitter"></div>`;

    document.getElementById('memorandumtitle').value = "";
    document.getElementById('newposttamemorandum').value = "";
    document.getElementById('newpostmemorandumstatus').style.display = "none";
    document.getElementById('newpostmemorandumbutton').style.display = "block";
    if (simplemde) {
        simplemde.value("");
    }

}

function memocompleted() {
    document.getElementById('memotitle').value = "";
    document.getElementById('newpoststatus').style.display = "none";
    document.getElementById('newpostbutton').style.display = "block";
    document.getElementById('newpostcompleted').innerHTML = getSafeTranslation('messagesent', "Message Sent.");
}

function geocompleted() {
    document.getElementById('newgeopostta').value = "";
    document.getElementById('newpostgeostatus').style.display = "none";
    document.getElementById('newpostgeobutton').style.display = "block";
    document.getElementById('newpostgeocompleted').innerHTML = getSafeTranslation('messagesent', "Message Sent.");
}