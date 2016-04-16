var mysql = require('mysql');	
var express = require('express');
//var bodyParser = require('body-parser'); FOR POST METHOD
var app     = express();
//NPM Module to integrate Handlerbars UI template engine with Express
var server = require('http').Server(app);
var exphbs  = require('express-handlebars');
var io = require('socket.io').listen(server);

//defining which user and database to use
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'tannugoyalU',
  database : 'newMovieLens'
});

//user id and movie id
var uid,mid;

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... \n\n");  
} else {
    console.log("Error connecting database ... \n\n");  
}
});

//will show you the login page
app.get('/',function  (req,res) {
	res.sendFile(__dirname + '/views/login.html');
});


//will process the login information
app.get('/login',function (req,res){
	uid = req.query.uid;
	console.log(uid);
	var qury = 'select count(*) as exist from user where uid='+uid;
	connection.query(qury, function(err, rows, fields) {
  		if (!err){
  			//console.log(fields); GIVE THE information about the colums
	  		for(value in rows){
	  			console.log(rows[value].exist);
		  		if(rows[value].exist==0)
		  		{
		  			res.render('login',{message : "try again"});
		  		}
		  		else
		  		{
		  			//have to be changes to html page
		  			res.render('option',{recomm : "http://127.0.0.1/collaborative_filtering/collab_filter.php?uid="+uid});
		  		}
		  	}
  		}
    	
 		else
    	{
    		console.log(err);
    		console.log('Error while performing Query.');
  		}
  	});
});


//will give the register page
app.get('/register',function (req,res){
	res.render('register');
});

//adds the user to the database
app.get('/adduser',function (req,res){
		var name = req.query.name;
		//console.log(name);
		var email = req.query.email;
		//console.log(email);
		var no = req.query.no;
		console.log(no);
		var qury = 'select count(*) as exist from user where email="'+email+'"';
		connection.query(qury, function(err, rows, fields){
			if(!err)
			{
				console.log(rows);
				if(rows[0].exist==0)
				{
					qury = 'insert into user (name,email,phoneno) values("'+name+'","'+email+'",'+no+')';
					connection.query(qury, function(err, rows, fields) {
						if(!err)
						{
							var qur = 'select uid from user where email="'+email+'"';
							connection.query(qur, function(err, rows, fields){
								if(!err)
								{
									uid = rows[0].uid;
									res.render('option',{message : "your uid is : "+uid,recomm : "http://127.0.0.1/collaborative_filtering/collab_filter.php?uid="+uid});
								}
								else
								{
									console.log("error when retiriving the uid");
									res.render('register',{message : 'try again'});
								}
							});
						}
						else{
							console.log("error during the add user phase");
							res.render('register',{message : "email already exist"});
						}
					});
				}
				else
				{
					res.render('register',{message : "username already exists"});
				}
			}
			else
			{
				console.log("problem in checking the availability of username");
				
			}
		});	
});

//route to give the rating given bu user
app.get('/rating',function  (req,res){
	res.sendFile(__dirname + '/views/rating.html');
});

//route to give the user the movie to rate upon
app.get('/rating1',function (req,res){
	//retriving a random movie to get rating of user id 1;

	var movieName = req.query.movieName;
	console.log(movieName);
	var qury = "select mid,title from movie where title like '"+movieName+"'";
	
	
	connection.query(qury, function(err, rows, fields) {
  		if (!err){
	  		//console.log(fields); GIVE THE information about the colums
	  		for(value in rows){
	  		mid = rows[value].mid;
	  		movieName = rows[value].title;
	  		res.render('rating',{title : movieName});
	  		}
  		}
    	
 		else
 		{	
 			console.log(err);
    		console.log('Error while performing Query.');
    		res.render('option',{message : "problem with rating link",recomm : "http://127.0.0.1/collaborative_filtering/collab_filter.php?uid="+uid});
  		}
  	});
});




app.get('/addrating',function (req,res){
	var rating = req.query.rating;
	console.log(uid + mid + rating);
	var qury = 'insert into orating values('+uid+','+mid+','+rating+')';//adding rating to the database for the particular uid and mid
	connection.query(qury, function(err, rows, fields) {
  		if (!err){
  			res.render('option',{recomm : "http://127.0.0.1/collaborative_filtering/collab_filter.php?uid="+uid});
  		//console.log(fields); GIVE THE information about the colums
  		}
 		else
    	{
    		console.log(err);
    		console.log('Error while performing Query.');
    		res.render('option',{message : "messageovie already rated",recomm : "http://127.0.0.1/collaborative_filtering/collab_filter.php?uid="+uid});
    	}
  		
  	});
});


app.get('/option',function (req,res){
	res.render('option',{message : "messageovie already rated",recomm : "http://127.0.0.1/collaborative_filtering/collab_filter.php?uid="+uid});
})

io.on('connection', function(socket){
  	socket.on('movieName', function(name){
    
		 
		var qury = 'select mid,title from movie where title like "%'+name+'%" order by title limit 10';
		var movieName;
		connection.query(qury, function(err, rows, fields) {
	  		if (!err){
	  			//res.writeHead(200, {'Content-Type': 'text/html'});
		  		//console.log(fields); GIVE THE information about the colums
		  		for(value in rows){
		  			
		  			mid = rows[value].mid;
		  			movieName = rows[value].title;
		  			var movie = {
		  				movieName : movieName,
		  				mid : mid
		  			}
		  			io.emit('movieName', movie);
		  			//res.write(movieName);
		  		}
	  		}
	    	
	 		else
	 		{	
	    		console.log('Error while performing Query.');
	    		//res.render('option',{message : "problem with rating link",recomm : "http://127.0.0.1/collaborative_filtering/collab_filter.php?uid="+uid});
	  		}
	  	});
    });
});


app.get('/*',function (req,res){
	res.sendStatus("dont just put anything after the link follow the link dont make your own links!");
});

server.listen(3000, function () {
     console.log("Express server listening on port " + 3000);
});

/*
//will give you the recommendaton
app.get('/recommendation',function (req,res){
	//getting all the movies that the uid rated
	var qury = 'select mid,rating from orating where uid='+uid;
	var seenMovie = "";
	connection.query(qury,function (err,rows,fields){
		if(!err)
		{
			var ratedMovie = rows;
			var similarity=[];
			var nsim=0;//numerator of similarity
			var dsim=0;//denomiantor of similarity
			var dlsim=0;//left side denomninator of similarity
			var drsim=0;//right side denominator of similarity
			var avgnur=[];//avg of not user rated movies
			var avgur=[];//avg of user rated movies
			var prediction =[];
			for(value in rows)
				seenMovie += rows[value].mid + ",";
			//getting random movies that the user didnt rated
			qury = 'select mid,title from movie where mid not in ('+seenMovie.substring(0,seenMovie.length-1)+') order by rand() limit 10000';
	 		connection.query(qury,function(err,rows,fields){
		 		if(!err)
			 	{
			 		
			 		var nur = rows;
			 		forloop(nur,function(avgnur){// calculating average for non rated user moveis
			 			forloop(ratedMovie,function(avgur){//calculating average for rated user movies
			 				doubleforloop(nur,ratedMovie,avgnur,avgur,function (similarity){
			 					//console.log(similarity);
			 				});
			 			});
			 		});
			 		//console.log(avgnur);
			 		
			 		for(value in ratedMovie)
			 		{
			 			qury='select avg(rating) as avg from newRating where mid='+ratedMovie[value].mid+' limit 10000';
			 			connection.query(qury,function (err,rows,fields){
			 				if(!err){
			 					avgur.push(rows[0].avg);
			 				}
			 				else{
			 					console.log("problem in calculating the avg of rated movies");
			 					res.render('option',{message : "problem in calculating the avg"});
			 				}
			 			});
			 		}
			 		
			 		
			 		//console.log("avg of rated movie calculated");
			 		


			 		
			 		console.log("got the whole similarity");
			 		
			 		for(value in nur){
			 			var np=0;//numerator of prediction
			 			var dp=0;//denominator of prediction
			 			var p=[];
			 			for(movie in ratedMovie){
			 				np += similarity[value][movie]*ratedMovie[movie].rating;
			 				dp += similarity[value][movie];

			 			}
			 			console.log(similarity[0][0]);

			 			p.push(np/dp);
			 			p.push(nur[value].nurmid)	
			 			prediction.push(p);
			 		}
			 		console.log("prediction made");
			 		console.log(prediction);
			 		
			 		var sort;
			 		for(value in nur){
			 			for(var v=0;v<nur.length-1;v++){
			 				if(prediction[v][0]<prediction[v+1][0])
			 				{
			 					sort = prediction[v];
			 					prediction[v] = prediction[v+1];
			 					prediction[v+1] = sort;
			 				}
			 			}
			 		}

			 		console.log("sorted prediction");

			 		for(value in nur){
			 			console.log(prediction[value][1]);
			 		}
			 		
			 	}
			 	else
			 	{
			 		console.log("problem in query for selection of random movies");
			 		res.render('option',{message : "problem with recommendation link"});


			 	}

			});
			
		}
		else
		{
			console.log("problem with finding the movies which user has rated");
			res.render('option',{message : "problem with recommendation link"});

		}
	});
	
});

function forloop (data,cb){
	var avgnur=[];
	for(i in data){
		fnavgnur(data,i,function(row){
			avgnur.push(row);
		});
	}
	cb(avgnur);
}

//function avg of non user rated moive
function fnavgnur (nur,value,cb) {
	var avgnur = [];
	var qury;
		qury='select avg(rating) as avg from newRating where mid='+nur[value].mid+' limit 1000';
		connection.query(qury,function (err,rows,fields){
			if(!err){
				//console.log(rows[0].avg);
				cb(rows[0].avg);
			}
			else{
				console.log(err);
				console.log("problem");
				res.render('option',{message : "problem in calculating the avg"});
			}
		});
}

function doubleforloop (nur,ratedMovie,avgnur,avgur,cb) {
	var similar=[];
	var sim = [];
	for(value in nur)
	{
		//takes the set of  unrated movie with the rated movie
		//takes the similarity of only unrated movie with the rated movie
		for(movie in ratedMovie)
		{	//obatining the user rating which has rated both the our user rated movie and the randomly selected movies
			//here urRating are the rating of the movies that the user rated
			//nurRating are the rating of the movie that the user didnt rated
			sim = similarity(nur,ratedMovie,value,movie,avgnur,avgur);
			//console.log("got the similarity");
		}
		similar.push(sim);	
	}
	console.log(similar);
	cb(similar);
}

function doublefor(nur,ratedMovie,value,movie,avgnur,avgur,cb){
	if(){

	}
	similarity(nur)
}
function similarity (nur,ratedMovie,value,movie,avgnur,avgur,cb) {
	var sim =[];
	var nsim = 0,dlsim = 0,drsim=0;
	qury = 'select nurRated.mid as nurmid, nurRated.rating as nurRating, urRating  from newRating as nurRated join (select uid,rating as urRating from newRating where mid='+ratedMovie[movie].mid+') as urRated on nurRated.uid=urRated.uid and mid ='+nur[value].mid;
	//console.log("will go in the connection for sure")
	connection.query(qury,function (err,rows,fields){
		if(!err)
		{
			console.log('in the connection');
			for(user in rows)
			{
				nsim += (rows[user].urRating-avgur[movie])*(rows[user].nurRating-avgnur[value]);
				dlsim +=  Math.pow((rows[user].urRating-avgur[movie]),2);
				drsim += Math.pow((rows[user].nurRating-avgnur[value]),2);
			}
			console.log(nsim);
			var dsim = Math.sqrt(dlsim)*Math.sqrt(drsim);
			var s = nsim/dsim;
			console.log(s);
			sim.push(s);
			cb(sim);
		}
		else
		{
			console.log("error when retriving the rating of unrated movies");
			res.render('option',{message : "problem with recommendation link"});
		} 
	});
}*/


//app.use(express.static(__dirname + '/views/'));//load static files from folder

//USE THIS IF YOU ARE USING POST
//Note that in version 4 of express, express.bodyParser() was
//deprecated in favor of a separate 'body-parser' module.
//app.use(bodyParser.urlencoded({ extended: true })); 

//content based recommendation
/*
app.get('/movie', function(req, res) {
	var name =  req.query.movie;
	// here we are getting the name of the movie from user and using the tags in the movie to identify the movies which are most similar to the name of the movie
	var qury = 'select count(*) as count,movie from(select distinct p.title as movie,pm.info as minfo,q.title,qm.info from aka_title as q,movie_info as qm, aka_title as p,movie_info as pm where q.title like \''+name+'\' and q.movie_id = qm.movie_id and qm.info = pm.info and pm.movie_id != q.movie_id and pm.movie_id = p.movie_id limit 10000) as e  group by movie order by count desc limit 10';
	//var qury  = 'select 1 as number';
	connection.query(qury, function(err, rows, fields) {
  		if (!err){
  		
  		//console.log(fields); GIVE THE information about the colums
  		for(value in rows)
  			console.log('The solution is: ', rows[value].movie);
   		}
    	
 		else
    	console.log('Error while performing Query.');
  	});


});
*/

