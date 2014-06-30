/*

Mimicking the Flickr photostream display

1. decide the number of pictures in a row.  This is probably based on some min max value of the original pics' widths added together.
2. Shrink the tallest pics to match the height of the shortest pic.  
3. Scale all pics to match the width of the photostream

*/

/* START GLOBALS */
var minprotorowwidth = 700;
var maxprotorowwidth = 1000;
var displayrowwidth = 700;

var streamImgs = new Array();
var loadedImgCount = 0;

var displaytarget = null;

$('document').ready(function() {
	displaytarget = $('#photostream');

	//minprotowidth = parseInt(displaytarget.width());
	//displayrowwidth = minprotowidth;
	//maxprotowidth = minprotowidth + 150;
});

/* END GlOBALS */

function registerLoadedImg() {
	loadedImgCount++;
	console.log("Image loaded checking...  total needed: " + streamImgs.length + " loaded: " + loadedImgCount);
	if (loadedImgCount == streamImgs.length) {
		allImgsLoaded();
	}
}

function allImgsLoaded() {
	console.log("All " + streamImgs.length + " loaded. Yay!");
	displayImgs();
}

function displayImgs() {
	var rowaccumulator = new Array();
	var accumulatedwidth = 0;
				
	$.each(streamImgs, function(index, img) {
		console.log("assessing image: " + index + " for row. img width: " + parseFloat(img.attr('naturalwidth')));
		accumulatedwidth += parseFloat(img.attr('naturalwidth'));
		
		if (accumulatedwidth > maxprotorowwidth) {
			//this image goes in the next row, but we display the existing row now
			displayRow(rowaccumulator);
			rowaccumulator = new Array(img);
			accumulatedwidth = parseFloat(img.attr('naturalwidth'));				
		} else if (accumulatedwidth > minprotorowwidth) {
			//add the img and display the row now
			rowaccumulator.push(img);
			displayRow(rowaccumulator);
			rowaccumulator = new Array();
			accumulatedwidth = 0;		
		} else {
			rowaccumulator.push(img);
		}
	});
	
	if (rowaccumulator.length > 0) {
		displayRow(rowaccumulator);
	}
}

/*
	Takes a number of img elements and displays them in a row
*/
function displayRow(rowaccumulator) {
	var rowtarget = $('<div class="photostreamrow" />');
	displaytarget.append(rowtarget);

	console.log("processing row with " + rowaccumulator.length + " images");

	//pass to find the shortest one
	var shortestimg = null;
	$.each(rowaccumulator, function(index, img) {
		if (
				shortestimg == null 
				|| parseInt(shortestimg.attr("naturalheight")) > parseInt(img.attr("naturalheight"))
			) {
			shortestimg = img;
		}
	});

	//pass to normalize the heights (virtually)
	var newrowwidth = 0;
	$.each(rowaccumulator, function(index, img) {
		if (parseInt(shortestimg.attr("naturalheight")) != parseInt(img.attr('naturalheight'))) {
			var scalingfactor = (parseFloat(shortestimg.attr('naturalheight')) / parseFloat(img.attr('naturalheight')));
			img.attr("heightscaling", scalingfactor);
			newrowwidth += parseInt(img.attr('naturalwidth')) * scalingfactor;
		} else {
			img.attr("heightscaling", "1");
			newrowwidth += img.width;
		}
	});
	
	//pass to scale the widths and show the images
	var widthscaling = (displayrowwidth / newrowwidth);
	if (widthscaling > 1.0) { //avoid last row blow up
		widthscaling = 1;
	}
	
	console.log("Row widthscaling: " + widthscaling);
	$.each(rowaccumulator, function(index, img) {
		var scaling = parseFloat(img.attr("heightscaling")) * widthscaling;
		img.attr('totalscaling', scaling);
		img.attr('width', (parseFloat(img.attr('naturalwidth')) * scaling));
		img.attr('height', (parseFloat(img.attr('naturalheight')) * scaling));
		rowtarget.append(img);
	});
	
}

/*
Top level function called somewhere on a page.  
(Can only be called once per page at the moment)
*/
function loadImgsForPhotoset(photosetid, userid, flickrkey) {
	streamImgs = new Array();
	loadedImgCount = 0;

	var flickrargs = {format:'json', api_key: flickrkey, user_id: userid, photoset_id: photosetid, method: 'flickr.photosets.getPhotos'};	
	console.log("Loading photos with args: " + JSON.stringify(flickrargs) + "\n");

	var supplementalphotodata = {
		'photosetid': photosetid, 
		'userid': userid, 
		'flickrkey': flickrkey,
		'photosize': 'm'
	}
	
	$.getJSON(flickrbase, flickrargs, function(data) {		
		console.log("photoset data:\n" + JSON.stringify(data) + "\n\n");
		
		$.each(data.photoset.photo, function(index, flickrphotodata) {
			streamImgs[index] = preloadImg(flickrphotodata, supplementalphotodata);
			console.log("preloading image index: " + index);
		});
		
		console.log("Done iterating over data\n");
	});
}

function preloadImg(flickrphotodata, supplementalphotodata) {
	var src = getImageUrl(flickrphotodata, supplementalphotodata);
	var flickrpage = getImageFlickrUrl(flickrphotodata, supplementalphotodata);
	var img = $('<img />');
	img.load(function() {
		img.attr('naturalwidth', this.width);
		img.attr('naturalheight', this.height);
		console.log("img loaded: " + src +  " width: " + this.width + " height: " + this.height);
		registerLoadedImg();
	});
	img.attr('class', 'photostreamimage');
	img.attr('flickrpage', flickrpage);
	img.attr('src', src);
	return img;
}

function getImageUrl(flickrphotodata, supplementalphotodata) {
	//http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg
	//from http://www.flickr.com/services/api/misc.urls.html	

	var url = "http://farm" + flickrphotodata.farm + ".staticflickr.com/" + flickrphotodata.server + "/" + flickrphotodata.id + "_" + flickrphotodata.secret;
	
	if (supplementalphotodata.photosize == "") {
		return url + ".jpg";
	} else {
		return url + "_" + supplementalphotodata.photosize + ".jpg";
	}	
}

function getImageFlickrUrl(flickrphotodata, supplementalphotodata) {
	//http://www.flickr.com/photos/100330886@N04/9594249168/in/set-72157635232920260
	var url = "http://www.flickr.com/photos/" + supplementalphotodata.userid + "/" + flickrphotodata.id + "/in/set-" + supplementalphotodata.setid;
	return url;
}

/**
Approach for QueryString access from: http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values
Usage:
$.QueryString["param"]
**/
(function($) {
    $.QueryString = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'))
})(jQuery);

function loadPhotosetList(flickrKey, flickrUserId, outputArea) {
	var flickrargs = {format:'json', api_key: flickrKey, user_id: flickrUserId, method: 'flickr.photosets.getList'};	
	console.log("Loading photoset with args: " + JSON.stringify(flickrargs) + "\n");

	$.getJSON(flickrbase, flickrargs, function(data) {		
		console.log("photoset data:\n" + JSON.stringify(data) + "\n\n");
		
		$.each(data.photosets.photoset, function(index, setdata) {
			var seturl = getSetUrl(setdata.id, flickrUserId);
			var settitle = setdata.title._content;
			console.log("inputs: " + seturl + ", " + settitle);
			var setlink = settitle;

			console.log("photoset: " + index + ":" + settitle + " " + setlink + " - " + setdata.id + JSON.stringify(setdata) + "\n");

			outputArea.append('<div id="setdiv' + setdata.id + '">');
			outputArea.append('<input type="button" class="setloadbutton" onclick="clickOnPhotoset(\'' + setdata.id + '\',\'' + flickrUserId + '\',\'' + flickrKey + '\')" value="load" />');
			outputArea.append("<strong>" + setlink + "</strong>");
			outputArea.append('<span id="setspan' + setdata.id + '"></span>');
			outputArea.append('</div>');	
		});
		
		console.log("Done iterating over data\n");
		
	});
}

function clickOnPhotoset(setid, userid, flickrkey) {
	loadImgsForPhotoset(setid, userid, flickrkey);
	$('#photosets').hide();
}

function getSetUrl(setId, flickrUserId) {
	console.log("getSetUrl(" + setId + "," + flickrUserId + ")");
	var out = "http://www.flickr.com/photos/" + flickrUserId + "/sets/" + setId;
	console.log("set url: " + out);
	return out + ""
}
