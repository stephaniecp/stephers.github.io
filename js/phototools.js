
function loadPhotosets(flickrKey, flickrUserId, outputArea) {
	var flickrargs = {format:'json', api_key: flickrKey, user_id: flickrUserId, method: 'flickr.photosets.getList'};	
	console.log("Loading photoset with args: " + JSON.stringify(flickrargs) + "\n");


	$.getJSON(flickrbase, flickrargs, function(data) {		
		console.log("photoset data:\n" + JSON.stringify(data) + "\n\n");
		
		$.each(data.photosets.photoset, function(index, setdata) {
			var seturl = getSetUrl(setdata.id, flickrUserId);
			var settitle = setdata.title._content;
			console.log("inputs: " + seturl + ", " + settitle);
			var setlink = getLinkHtml(seturl, settitle);

			console.log("photoset: " + index + ":" + settitle + " " + setlink + " - " + setdata.id + JSON.stringify(setdata) + "\n");

			outputArea.append('<div id="setdiv' + setdata.id + '">')
			outputArea.append('<input type="button" class="setloadbutton" onclick="loadPhotosetPhotos(\'' + setdata.id + '\',\'' + flickrUserId + '\',\'' + flickrKey + '\')" value="load" />');
			outputArea.append("<strong>" + setlink + "</strong>");
			outputArea.append('<span id="setspan' + setdata.id + '"></span>');
			outputArea.append('</div>');	
		});
		
		console.log("Done iterating over data\n");
		
	});
}

function loadPhotosetPhotos(photosetId, userId, flickrKey) {
	var flickrargs = {format:'json', api_key: flickrKey, user_id: userId, photoset_id: photosetId, method: 'flickr.photosets.getPhotos'};	
	console.log("Loading photos with args: " + JSON.stringify(flickrargs) + "\n");
	
	var optiondata = getOptionData();
	var previewoptiondata = getPreviewOptionData();

	var setspan = $('#setspan' + photosetId)
	setspan.html("");
	
	if (optiondata.showsetpreview) {
		setspan.append('<div id="setpreview' + photosetId + '"></div>');
	}
	
	setspan.append('<pre id="setpre' + photosetId + '"></pre>');
	
	$.getJSON(flickrbase, flickrargs, function(data) {		
		console.log("photos data:" + JSON.stringify(data) + "\n");

		var settarget = $('#setpre' + photosetId);
		var setpreviewtarget = $('#setpre' + photosetId);
		
		$.each(data.photoset.photo, function(index, photodata) {
			console.log("photo: " + JSON.stringify(photodata) + "\n");
		
			settarget.append(getImageHtml(optiondata, photodata, photosetId));
			settarget.append("\n");

			if (optiondata.showsetpreview) {
				setpreviewtarget.before(getImagePreviewHtml(previewoptiondata, photodata, photosetId));
			}
			
		});
	});
}

function getImagePreviewHtml(optiondata, photodata, photosetId) {
	var result = getImageHtml(optiondata, photodata, photosetId);
	result = result.replace(/&gt;/g,">");
	result = result.replace(/&lt;/g, "<");
	console.log("preview image link: " + result);
	return result;
}

function getImageHtml(optiondata, photodata, photosetId) {
	var html="";
	
	if (optiondata.includelink) {
		var flickrUrl = getImageFlickrUrl(optiondata.user, photodata.id, photosetId);
		html += '&lt;a';
		if (optiondata.linkclass != "") {
			html += ' class="' + optiondata.linkclass + '"';
		}
		html += ' href="' + flickrUrl + '"&gt;';
	}

	var imageUrl = getImageUrl(optiondata, photodata);
	if (optiondata.includeimg) {
		html += '&lt;img';
		if (optiondata.imgclass != "") {
			html += ' class="' + optiondata.imgclass + '"';
		}
		html += ' title="' + photodata.title + '" src="' + imageUrl + '"&gt;';
	} else {
		html += imageUrl;
	}
	
	if (optiondata.includelink) {	
		html += '&lt;/a&gt;';
	}
	
	return html;
}

function getImageUrl(optiondata, photodata) {
	//http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg
	//from http://www.flickr.com/services/api/misc.urls.html	

	var url = "http://farm" + photodata.farm + ".staticflickr.com/" + photodata.server + "/" + photodata.id + "_" + photodata.secret
	if (optiondata.size == "") {
		return url + ".jpg";
	} else {
		return url + "_" + optiondata.size + ".jpg";
	}	
}

function getImageFlickrUrl(userId, imageId, setId) {
	//http://www.flickr.com/photos/100330886@N04/9594249168/in/set-72157635232920260
	var url = "http://www.flickr.com/photos/" + userId + "/" + imageId + "/in/set-" + setId;
	return url
}

function getSetUrl(setId, flickrUserId) {
	console.log("getSetUrl(" + setId + "," + flickrUserId + ")");
	var out = "http://www.flickr.com/photos/" + flickrUserId + "/sets/" + setId;
	console.log("set url: " + out);
	return out + ""
}

function getLinkHtml(urlstring, text) {
	console.log("getLinkHtml(" + urlstring + ", " + text + ")");
	var out = '<a href="' + urlstring + '">' + text + '</a>';
	console.log(out);
	return out;
}