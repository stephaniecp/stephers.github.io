$(document).ready(function() {
	set_tagline();
	//setTimeout("roll_tagline()", 2000);
});
	
function set_tagline() {
	//alert("set tag");
	var tags = $(".tagline");
	console.log(tags);
	var tag = tags[Math.floor(Math.random()*tags.length)];
	if (tag) {
		$(tag).show();
	}
}

function roll_tagline() {
	//alert("roll");
	$(".tagline").hide();
	//$(".tagline").each(function(tag) {
	//	alert(tag);
	//});
	set_tagline();
}
