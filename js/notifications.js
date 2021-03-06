"use strict";

var lastViewOfNotifications = 0;
var lastViewOfNotificationspm = 0;

function displayNotificationCount() {
    if (!pubkey) {
        return;
    }
    lastViewOfNotifications = Number(localStorageGet(localStorageSafe, "lastViewOfNotifications"));
    lastViewOfNotificationspm = Number(localStorageGet(localStorageSafe, "lastViewOfNotificationspm"));
    var theURL = dropdowns.contentserver + '?action=alertcount&address=' + pubkey + '&since=' + lastViewOfNotifications + '&sincepm=' + lastViewOfNotificationspm;
    getJSON(theURL).then(function (data) {

        if (data[0].count == null) {
            return;
        }

        setAlertCount("alertcount", data[0].count);
        setAlertCount("alertcountpm", data[0].countpm);

        var pageTitleCount = data[0].count + data[0].countpm;
        var pageTitle = "";
        if (pageTitleCount > 0) {
            pageTitle = "(" + pageTitleCount + ") ";
        }
        document.title = pageTitle + siteTitle;
        setTimeout(displayNotificationCount, 60000);
    }, function (status) { //error detection....
        showErrorMessage(status, null, theURL);
    });
}

function setAlertCount(elementid, alertNumber) {
    var alertcount = Number(alertNumber);
    var element = document.getElementById(elementid);
    if (alertcount > 0) {
        element.innerHTML = alertcount;
        element.style.visibility = "visible";
    } else {
        element.innerHTML = "";
        element.style.visibility = "hidden";
    }

}

function populateNotificationTab(limit,nfilter,minrating){
    let options='&limit='+limit+'&minrating='+minrating;
    document.getElementById("notificationtypes").innerHTML =
    `<a data-vavilon="notificationall" data-vavilon_title="notificationall" title="See all notifications" class="`+(nfilter==''?'filteron':'filteroff')+`" href="#notifications?nfilter=`+options+`">All</a>
    <span class="separator"></span>
    <a data-vavilon="notificationlikes" data-vavilon_title="notificationlikes" title="See only likes" class="`+(nfilter=='like'?'filteron':'filteroff')+`" href="#notifications?nfilter=like`+options+`">Likes</a>
    <span class="separator"></span>
    <a data-vavilon="notificationfollows" data-vavilon_title="notificationfollows" title="See only follows" class="`+(nfilter=='follow'?'filteron':'filteroff')+`" href="#notifications?nfilter=follow`+options+`">Follows</a>
    <span class="separator"></span>
    <a data-vavilon="notificationreplies" data-vavilon_title="notificationreplies" title="See only replies" class="`+(nfilter=='reply'?'filteron':'filteroff')+`" href="#notifications?nfilter=reply`+options+`">Replies</a>
    <span class="separator"></span>
    <a data-vavilon="notificationratings" data-vavilon_title="notificationratings" title="See only ratings" class="`+(nfilter=='rating'?'filteron':'filteroff')+`" href="#notifications?nfilter=rating`+options+`">Ratings</a>
    <span class="separator"></span>
    <a data-vavilon="notificationpages" data-vavilon_title="notificationpages" title="See only pages" class="`+(nfilter=='page'?'filteron':'filteroff')+`" href="#notifications?nfilter=page`+options+`">Pages</a>
    <span class="separator"></span>
    <a data-vavilon="notificationremembers" data-vavilon_title="notificationremembers" title="See only remembers" class="`+(nfilter=='repost'?'filteron':'filteroff')+`" href="#notifications?nfilter=repost`+options+`">Remembers</a>
    <span class="separator"></span>
    <a data-vavilon="notificationtips" data-vavilon_title="notificationremembers" title="See only tips" class="`+(nfilter=='tip'?'filteron':'filteroff')+`" href="#notifications?nfilter=tip`+options+`">Tips</a>
    <span class="separator"></span>`;

    if(notificationFilter.element){
        notificationFilter.element.setRating(minrating);
    }

}

function getAndPopulateNotifications(start, limit, page, qaddress, txid, nfilter, minrating) {
    //Clear existing content
    show(page);


    document.getElementById("notificationsbody").innerHTML = document.getElementById("loading").innerHTML;

    populateNotificationTab(limit,nfilter,minrating);
    
    
    //Show navigation next/back buttons


    //Request content from the server and display it when received
    var minRatingTransposed = transposeStarRating(minrating);
    notificationFilter.type=nfilter;
    notificationFilter.minrating=minrating;
    

    var theURL = dropdowns.contentserver + '?action=' + page + '&address=' + pubkey + '&qaddress=' + qaddress + '&start=' + start + '&limit=' + limit + '&nfilter=' + nfilter + '&minrating=' + minRatingTransposed;
    getJSON(theURL).then(function (data) {
        //data = mergeRepliesToRepliesBySameAuthor(data);
        //var navbuttons = getNavButtonsNewHTML(start, limit, page, qaddress, "getAndPopulateNotifications", data.length > 0 ? data[0].unduplicatedlength : 0);
        var navbuttons = getNotificationNavButtonsNewHTML(start, limit, page, qaddress, minrating, nfilter, data.length > 0 ? data[0].unduplicatedlength : 0);
        //var navbuttons = getNavButtonsHTML(start, limit, page, 'new', qaddress, "", "getAndPopulateNotifications", data.length > 0 ? data[0].unduplicatedlength : 0);

        var contents = ``;


        for (var i = 0; i < data.length; i++) {
            try {
                contents = contents + getHTMLForNotification(data[i], i + 1 + start, page, i, (data[i].txid == txid));
            } catch (err) {
                console.log(err);
            }
        }
        //console.log(contents);
        if (contents == "") {
            contents = getDivClassHTML("message", getSafeTranslation("nonotifications", "No notifications yet"));
        }


        try {
            if (window.Notification.permission != 'granted') {
                contents = allowNotificationButtonHTML() + contents;
            } else {
                requestNotificationPermission();
            }
        } catch (err) {
            //possibly catching an exception generated by ios here
            contents = allowNotificationButtonHTML() + contents;
            updateStatus(err);
        }



        contents = getNotificationsTableHTML(contents, navbuttons);

        //Update last view of notifications iff the user is looking at the first page of notifications.
        if (start == 0) {
            lastViewOfNotifications = parseInt(new Date().getTime() / 1000);
            localStorageSet(localStorageSafe, "lastViewOfNotifications", lastViewOfNotifications);
            setAlertCount("alertcount", 0);
            document.title = siteTitle;
        }


        document.getElementById("notificationsbody").innerHTML = contents; //display the result in an HTML element
        addDynamicHTMLElements(data);
        if (txid) {
            scrollToPosition('notification' + san(txid));
        } else {
            scrollToPosition();
        }


        //Activate navigation filter star ratings
        let theElement = document.getElementById('notificationsfilter');
        let starSize = Number(theElement.dataset.ratingsize);

        if (!notificationFilter.element) {
            notificationFilter.element = raterJs({
                starSize: starSize,
                rating: notificationFilter.minrating,
                element: theElement,
                showToolTip: false,
                rateCallback: function rateCallback(rating, done) {
                    notificationFilter.element.setRating(rating);
                    done();
                    notificationFilter.minrating=rating;
                    getAndPopulateNotifications(0, notificationFilter.limit, "notifications", pubkey, txid, notificationFilter.type, notificationFilter.minrating);
                }
            });
        }


        listenForTwitFrameResizes();
        //window.scrollTo(0, scrollhistory[window.location.hash]);


        //Put this at the end - it may be failing silently on iOS, so does least damage here
        /*if (window.Notification.permission == 'granted') {
            try {
                //notification subscriptions seem to get cancelled a lot - keep requesting subscription if granted to ensure continuity
                requestNotificationPermission();
            } catch (err) {
                //possibly catching an exception generated by ios here
                console.log(err);
            }
        }*/

    }, function (status) { //error detection....
        showErrorMessage(status, page, theURL);
    });
}

var notificationFilterRating;
var notificationFilter=[];
notificationFilter.type="";
notificationFilter.minrating=0;
notificationFilter.start=0;
notificationFilter.limit=25;


function userFromData(data, mainRatingID) {
    return userHTML(data.origin, data.originname, mainRatingID, data.raterrating, 16, data.originpagingid, data.originpublickey, data.originpicurl, data.origintokens, data.originfollowers, data.originfollowing, data.originblockers, data.originblocking, data.originprofile, data.originisfollowing, data.originnametime, true, data.originlastactive, data.originsysrating);
}


function getHTMLForNotification(data, rank, page, starindex, highlighted) {
    if (checkForMutedWords(data)) return "";
    let type = ds(data.type);
    let mainRatingID = starindex + page + ds(data.origin);
    let postRatingID = "";

    //For root posts, we show number of replies as total
    //For comments, just the number of direct replies
    if (data.ltxid == data.lroottxid) {
        data.lreplies = data.lrepliesroot;
    }
    if (data.rtxid == data.rroottxid) {
        data.rreplies = data.rrepliesroot;
    }

    let referencedPostHTML = "";

    postRatingID = starindex + page + ds(data.raddress) + type;
    referencedPostHTML = getHTMLForPostHTML(data.rtxid, data.raddress, data.originname, data.rlikes, data.rdislikes, data.rtips, data.rfirstseen, data.rmessage, data.rroottxid, data.rtopic, data.rreplies, data.rgeohash, page, postRatingID, data.rlikedtxid, data.rlikeordislike, data.repliesroot, data.raterrating, starindex, data.rrepostcount, data.rrepostidtxid, data.originpagingid, data.originpublickey, data.originpicurl, data.origintokens, data.originfollowers, data.originfollowing, data.originblockers, data.originblocking, data.originprofile, data.originisfollowing, data.originnametime, '', data.originlastactive, true, data.originsysrating, data.rsourcenetwork);
    
    if(type=="like" || (type=="repost" && data.rposttype==0)){
        postRatingID = starindex + page + ds(data.address) + type;
        referencedPostHTML = getHTMLForPostHTML(data.ltxid, data.laddress, data.username, data.llikes, data.ldislikes, data.ltips, data.lfirstseen, data.lmessage, data.lroottxid, data.ltopic, data.lreplies, data.lgeohash, page, postRatingID, data.likedtxid, data.likeordislike, data.repliesroot, data.selfrating, starindex, data.lrepostcount, data.lrepostidtxid, data.userpagingid, data.userpublickey, data.userpicurl, data.usertokens, data.userfollowers, data.userfollowing, data.userblockers, data.userblocking, data.userprofile, data.userisfollowing, data.usernametime, '', data.originlastactive, true, data.originsysrating, data.lsourcenetwork);
    }

    switch (type) {
        case "message":
            /*return notificationItemHTML(
                "message",
                `img/icons/notification/message.png`,
                userFromData(data, mainRatingID) + getSpanHTML('plaintext','messagedyou','messaged you'),
                timeSince(Number(data.time),true),
                "",
                data.txid, highlighted
            );*/
            break;
        case "thread":

            return notificationItemHTML(
                "thread",
                `img/icons/notification/discussion.png`,
                userFromData(data, mainRatingID) + ` ` + postlinkHTML(data.txid, "replied") + getSpanHTML('plaintext', 'discussion', `in a discussion you're in'`),
                timeSince(Number(data.time), true),
                referencedPostHTML,
                data.txid, highlighted
            );
            break;
        case "topic":
            return notificationItemHTML(
                "topic",
                `img/icons/notification/post.png`,
                userFromData(data, mainRatingID) + ` ` + postlinkHTML(data.txid, "posted") + getSpanHTML('plaintext', 'inatopic', `in a tag you're subscribed to`),
                timeSince(Number(data.time), true),
                referencedPostHTML,
                data.txid, highlighted
            );
            break;
        case "page":
            return notificationItemHTML(
                "page",
                `img/icons/notification/mentioned.png`,
                userFromData(data, mainRatingID) + getSpanHTML('plaintext', 'mentionedyou', 'mentioned you in a') + postlinkHTML(data.txid, `post`),
                timeSince(Number(data.time), true),
                referencedPostHTML,
                data.txid, highlighted
            );
            break;
        case "reply":
            return notificationItemHTML(
                "reply",
                `img/icons/notification/reply.png`,
                userFromData(data, mainRatingID) + ` ` + postlinkHTML(data.txid, "replied") + getSpanHTML('plaintext', 'toyour', 'to your') + postlinkHTML(data.rretxid, "post"),
                timeSince(Number(data.time), true),
                referencedPostHTML,
                data.txid, highlighted
            );
            break;
        case "rating":
            var theRating = 0;
            if (data.rating) { 
                theRating = outOfFive(data.rating); 
            }
            return notificationItemHTML(
                "rating",
                `img/icons/notification/star.png`,
                userFromData(data, mainRatingID) + getSpanHTML('plaintext', 'ratedyou', 'rated you as') + theRating + getSpanHTML('plaintext', 'starscommenting', 'stars, commenting ...') + getSpanClassHTML("plaintext", escapeHTML(data.reason)),
                timeSince(Number(data.time), true),
                "",
                data.txid, highlighted
            );
            break;
        case "follow":
            return notificationItemHTML(
                "follow",
                `img/icons/notification/follow.png`,
                userFromData(data, mainRatingID) + getSpanHTML('plaintext', 'followedyou', 'followed you'),
                timeSince(Number(data.time), true),
                "",
                data.txid, highlighted
            );
            break;
        case "like":
            if (data.llikedtxid == null) {
                //Server returns empty likes sometimes, probably if a like is superceeded by another like
                return "";
            }
            var postHTML = "";
            var messageType = postlinkHTML(data.likeretxid, "remember");
            if (data.lmessage) {
                messageType = postlinkHTML(data.likeretxid, "post");
                //This is a like of a post
                postHTML = referencedPostHTML;
            }
            return notificationItemHTML(
                "like",
                `img/icons/notification/liked.png`,
                userFromData(data, mainRatingID) + getSpanHTML('plaintext', 'likedyour', 'liked your') + messageType + getSpanClassHTML("plaintext", (Number(data.amount) > 0 ? balanceString(Number(data.amount), false) : "")),
                timeSince(Number(data.time), true),
                postHTML,
                data.txid, highlighted
            );
            break;
        case "repost":

            return notificationItemHTML(
                "repost",
                `img/icons/notification/repost.png`,
                userFromData(data, mainRatingID) + ((data.rposttype==0)?getSpanHTML('plaintext', 'rememberedyour', 'remembered your'):getSpanHTML('plaintext', 'quoterememberedyour', 'quote remembered your')) + postlinkHTML(data.likeretxid, "post") + ` ` + (Number(data.amount) > 0 ? balanceString(Number(data.amount), false) : ""),
                timeSince(Number(data.time), true),
                referencedPostHTML,
                data.txid, highlighted
            );
            break;

        // Maybe shelve these 'negative' ones
        case "unfollow":
            //return `Unfollow: User x unfollowed you time`;
            break;
        case "mute":
            //return `Mute: User x muted you time`;
            break;
        case "unmute":
            //return `Unmute: User x unmuted you time`;
            break;
        case "dislike":
            //return `Dislike: User x disliked your post | post`;
            break;
        //reply, rating, follow, unfollow, mute, unmute, like, dislike
        default:
            return '';
            break;
    }
    return '';
}
