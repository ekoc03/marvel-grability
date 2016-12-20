// :::::::::::::::::: Function for templates ::::::::::::::::::::://
var tmpl = function(str) {
	return new Function('data', "var p='" +
		str.replace(/[\r\t\n]/g, ' ')
		.replace(/'(?=[^%]*%>)/g, "\t")
		.split("'").join("\\'")
		.split("\t").join("'")
		.replace(/<%=(.+?)%>/g, "';p+=$1;p+='")
		.split('<%').join("';")
		.split('%>').join("p+='")
		+ "';return p;");
};

// ::::::::::::::::::::::: General variables :::::::::::::::::::::://
var key= 'b501a4723cd352b6c955bb08186ef53a',
	hash = '8ccf7df678afe705e4781b95efaff63e9048726e';

// :::::::::::::::: Show loading when ajax start :::::::::::::://

$('#loading').bind('ajaxStart', function(){
	$(this).show();
}).bind('ajaxStop', function(){
	$(this).hide();
});

// ::::::::::: Load characteres based on seacrh terms ::::::://

$('#btn-search').click(function(){
	event.preventDefault();
	$('.super-heroes, .comics, .super-info, .list-favorites').empty();
	var q = $("#search").val(),
		super_tmpl = tmpl($('#tmpl-super-heroes').html());
	$.ajax({
		type: 'GET',
		url: 'https://gateway.marvel.com:443/v1/public/characters?nameStartsWith='+q+'&limit=10&apikey='+key+'&hash='+hash,
		dataType: 'json',
	}).success(function(data) {
		for (var i = 0; i < data.data.results.length; i++) {
			$('.super-heroes').append(super_tmpl(data.data.results[i]));
		}
		if(data.data.results.length == 0){
			$('.super-heroes').append("<li>There's no available characters related with your search</li>")
		}
	}).fail(function(error){
		console.log(error);
	});

})    

// ::::::::::: Load Comics based on selected character ::::::://

var characterId;

$(document).on('click', '.super-heroes li a', function(e) {
	var comics_tmpl = tmpl($('#tmpl-comics').html());
	characterId = $(this).data('id');
	$('.super-info, .super-heroes').empty();
	$('#loading').show();
	$.ajax({
		type: 'GET',
		url: 'https://gateway.marvel.com:443/v1/public/characters/'+characterId+'/comics?apikey='+key+'&hash='+hash,
		dataType: 'json',
	}).success(function(data) {
		getCharacterInfo();
		for (var i = 0; i < data.data.results.length; i++) {
			$('.comics').append(comics_tmpl(data.data.results[i]));
		}
		if(data.data.results.length == 0){
			$('.comics').append("<li>This character doesn't have related comics</li>");
		}
	}).complete(function(){
		$('#loading').hide();

	}).fail(function(error){
		console.log(error);
	});
	return false;
});

// ::::::::::: Get information of specific character ::::::://

function getCharacterInfo(){
	var super_tmpl = tmpl($('#tmpl-super').html());
	$('.super-info').empty();
	$.ajax({
		type: 'GET',
		url: 'https://gateway.marvel.com:443/v1/public/characters/'+characterId+'?apikey='+key+'&hash='+hash,
		dataType: 'json',
	}).success(function(data) {
		$('.super-info').append(super_tmpl(data.data.results[0]));
	}).fail(function(error){
		console.log(error);
	});
}

// :::::::::::: Load detail of specific comic :::::::::::://

$(document).on('click', '.comics li a', function(e){
	var comicId = $(this).attr('id'),
		comic_detail_tmpl = tmpl($('#tmpl-modal').html());
	$('.comic-detail .modal-dialog').empty();
	$.ajax({
		type: 'GET',
		url: 'https://gateway.marvel.com:443/v1/public/comics/'+comicId+'?apikey='+key+'&hash='+hash,
		dataType: 'json',
	}).success(function(data) {
		favs = JSON.parse(localStorage.getItem('favorites'));
		if (favs) {	
			var id = data.data.results[0].id
			var exist = favs.filter( fav => fav.id === id )
			if (exist.length > 0) {
				data.data.results[0].favorite = true;
			}
		}
		$('.comic-detail .modal-dialog').append(comic_detail_tmpl(data.data.results[0]));
	}).complete(function(){
		$('#loading').hide();

	}).fail(function(error){
		console.log(error);
	});
	return false;
});

// ::::::::::::::::::: Add favorites comics :::::::::::::::://

var favorites = [];
var index = [];

$(document).on('click', '.add-favorite', function(e){
	var comic = $(this).data('comic');
	if (favorites.length > 0){
		index = favorites.filter( fav => fav.id === comic.id )
	}
	if (index.length == 0) {
		if(favorites.length > 2){
			alert('Full favorites limit, please clean Local Storage')
			return;
		}
		favorites.push(comic);
		$(this).text('Added');
	}
	localStorage.setItem("favorites", JSON.stringify(favorites));
});

// ::::::::::::::::::: View favorites comics :::::::::::::::://

var favs;

$('#view-favorites').click(function(){
	$('.super-heroes, .comics, .super-info').empty();
	var favorites_tmpl = tmpl($('#tmpl-favorites').html());
	favs = JSON.parse(localStorage.getItem('favorites'));
	if(favs.length>0){
		for (var i = 0; i < favs.length; i++) {
			if(favs.includes(favs[i])){
				$('.list-favorites').append(favorites_tmpl(favs[i]));
			}
		}
	}else{
			$('.list-favorites').append('<li>Your favorites list is empty.</li>')
		}
	
});

// ::::::::::::::::::: Delete favorite comic :::::::::::::::://

$(document).on('click', '.delete', function(e){
	$(this).parent().remove();
	favorites = JSON.parse(localStorage.getItem('favorites'));
	comic = $(this).data('comic');
	for (var i = 0; i < favorites.length; i++) {
		if(favorites[i].id == comic.id){
			favorites.splice(favorites[i],1)
		}
	}
	localStorage.setItem("favorites", JSON.stringify(favorites));
})
