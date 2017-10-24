
<?php
header("Access-Control-Allow-Origin: *");
$dbhost = 'localhost';
$dbuser = 'root';
$dbpass = 'DBPassword';

$conn = mysql_connect($dbhost, $dbuser, $dbpass);
if(! $conn )
{
  die('Could not connect: ' . mysql_error());
}
mysql_select_db('newMovieLens');

//change the uid to accept the uid from nodejs
$uid = $_GET['uid'];
//select rated movies from user database created locally
$sql = 'select mid,rating from orating where uid='.$uid;//retriving rated movies by user in the database created locally
$retval = mysql_query( $sql, $conn );
if(! $retval )
{
  die('Could not get data: ' . mysql_error());
}

$avgR=0;
$urRated = array();
$urAvg = array();
$urRatedM = "";
$count = 0;
while($rated = mysql_fetch_array($retval, MYSQL_ASSOC))
{
	array_push($urRated, $rated);//stores the above retirval in a variable
	$urRatedM .= $rated['mid'].",";

	//getting avg for the user rated movies
	$avgq = 'select avg(rating) as avg from newRating where mid='.$rated['mid'].' order by rand() limit 100';
	$r = mysql_query( $avgq, $conn );
	$i =  mysql_fetch_array($r, MYSQL_ASSOC);
	$avgR += $i['avg'];
	array_push($urAvg, $i['avg']);
	$count++;
}

$avgR /= $count;
$urRatedM = substr($urRatedM, 0, -1);

//getting random movies that the user didnt rated

$umovie = 'select mid,title from movie where mid not in ('.$urRatedM.') order by rand() limit 10';
$retval = mysql_query( $umovie, $conn );
if(!$retval){
	echo 'could not get the random movies'; 
	die('could not get the random movies' .mysql_error());
}

$urat=array();

//retriving the user which has rated both the unrated movie of user 1 and rated movie of user 1
$i=0;
$similarity = array();

$nur = array();
//echo "going into retwal";
while($nurRated = mysql_fetch_array($retval,MYSQL_ASSOC))
{
	//echo "in while";
	array_push($nur,$nurRated);
	$sim = array();
	//getting avg rating of the non rated movie we are currently working for
	$avg = 'select avg(rating) as avg from newRating where mid='.$nurRated['mid'].' limit 100';
	$retAvg = mysql_query($avg,$conn);
	if(!$retAvg){
		die(mysql_error());
	}
	$nurAvg = mysql_fetch_array($retAvg,MYSQL_ASSOC);
	//echo $nurRated['mid'].'<br>';
	
	foreach ($urRated as $key => $value) {
		$qury = 'select nurRated.mid as nurmid, nurRated.rating as nurRating, urRating  from newRating as nurRated join (select uid,rating as urRating from newRating where mid='.$value['mid'].' limit 10) as urRated on nurRated.uid=urRated.uid and mid ='.$nurRated['mid']." limit 10";
		$retRat = mysql_query($qury,$conn);
		if(!$retRat)
		{
			die(mysql_error());
		}		
		$nsim=0;
		$dlsim=0; 
		$drsim=0;

		//echo "calculating<br>".$value['mid'];
		while($rat = mysql_fetch_array($retRat,MYSQL_ASSOC)){
			//echo "calculating away";
			$nsim += ($rat['urRating']-$urAvg[$key])*($rat['nurRating']-$nurAvg['avg']); //numerator of similarity
			$dlsim +=  pow(($rat['urRating']-$urAvg[$key]),2);//denominator of sim left side
			$drsim +=  pow(($rat['nurRating']-$nurAvg['avg']), 2);//denominator of sim right side
			//var_dump($dlsim);
			//
		}
			$dsim = sqrt($dlsim)*sqrt($drsim);
			if(!$dsim){
				$dsim = 0.00000000001;
			}
			$s = $nsim/$dsim;
		//echo "nsim=".$nsim."dsim=".$dsim."<br>";
		//var_dump($s);
		//echo "<br>";
		array_push($sim, $s);
		
	}
	array_push($similarity, $sim);
}

$prediction = array();

foreach($similarity as $key => $row)
{
	$np=0;//numerator of prediction
	$dp=0;//denominator of prediction
	$p = array();
	foreach ($row as $key2 => $value) {
		$np += $value*$urRated[$key2]['rating'];
		$dp += abs($value);
	}

	if(!$dp){
		$v = $avgR;// if zero then default to avg of user rating
	}
	else{
		$v = $np/$dp;
	}
	array_push($p,$v);
	array_push($p,$nur[$key]['title']);	
	array_push($prediction,$p);
}
//echo "<br>";
//var_dump($prediction);

//now for the serendipity part


$newPrediction = array();
$AvgGenre = array();

//var_dump($nur);
foreach($nur as $key => $value) {
	$newPred = array();
	$avgG = 0;
	$count = 0;	
	foreach ($urRated as $key1 => $value1) {
		$qury = 'select count(urg.mid) as count from genre as urg,genre as nurg where urg.mid='.$value['mid'].' and nurg.mid ='.$value1['mid'].' and urg.genre = nurg.genre' ;	
		$gen = mysql_query($qury,$conn);
		if(!$gen)
		{
			die(mysql_error());
		}
		$genre = mysql_fetch_array($gen,MYSQL_ASSOC);

		$avgG += $genre['count'];
		$count++;
	}
	$avgGenre = $avgG/$count;
	$avgGenre /= 19; 
	//echo $i;
	array_push($AvgGenre,$avgGenre);
	$pred = ($prediction[$key][0]*0.5/5) - ($avgGenre*(0.5));
	//$u = $avgGenre*0.5;
	//echo $avgGenre." ".$u." ".$value['title']."<br>";
	array_push($newPred,$pred);
	array_push($newPred, $value['title']);
	array_push($newPred,$avgGenre);
	array_push($newPrediction,$newPred); 
}

//gettting the total no of rating
$qury = "select count(*) as count from newRating";
$n_info = mysql_query($qury, $conn);
$n = mysql_fetch_array($n_info,MYSQL_ASSOC);
//echo "$n : ";
//var_dump($n['count']);
$seren = array();
foreach ($nur as $key => $value1) {
	$serenmin = array();
	//getting the no of user that rated non user rated movies
	$qury = "select count(mid) as count from newRating where mid = ".$value1['mid'];
	$y_info = mysql_query($qury,$conn);
	$y = mysql_fetch_array($y_info,MYSQL_ASSOC);
	//echo "<br>y : ";
	//var_dump($y['count']);

	$min = 2;
	foreach ($urRated as $i => $value) {
		
		//echo "<br>nur";
		//var_dump($value1['mid']);

		//getting the no of user that rated the movies seen by the user
		$qury = "select count(*) as count from newRating where mid = ".$value['mid'];
		$x_info = mysql_query($qury, $conn);
		$x = mysql_fetch_array($x_info,MYSQL_ASSOC);
		//echo "<br>x:";
		//var_dump($x['count']);
		
		//getting the no of user that rated both the (user rated movies) and non user rated movies
		$qury = "select count(r.mid) as count from newRating as r join ( select uid from newRating where mid = ".$value['mid']." limit 10) as u on r.uid = u.uid and r.mid = ".$value1['mid']." limit 10";
		$xy_info = mysql_query($qury, $conn);
		$xy = mysql_fetch_array($xy_info,MYSQL_ASSOC);
		//echo "<br>xy : ";
		//var_dump($xy['count']); 		

 		$px = $x['count']/$n['count'];
 		$py = $y['count']/$n['count'];
 		$pxy = $xy['count']/$n['count'];

 		if(!$pxy){
 			$npmi = 1;
 		}else{
 			$npmi = log($pxy/($px*$py),10)/log($pxy,10);
 		}

 		if($min>$npmi){
 			$min = $npmi;
 		}
 		//echo "<br>npmi : ";
 		//var_dump($npmi);
	}
	//divided by 5 for normalisation purpose
	$pred = ($prediction[$key][0]*0.4/5) - ($AvgGenre[$key]*(0.3)) + ($min*0.3);
	array_push($serenmin, $pred);
	array_push($serenmin,$min);
	array_push($serenmin, $value1['title']);
	array_push($seren, $serenmin);
}


//var_dump($newPrediction);
foreach ($prediction as $i => $value) {
	for($j=0;$j<sizeof($prediction)-1;$j++) {
		if($prediction[$j][0]<$prediction[$j+1][0]){
			$temp = $prediction[$j];
			$prediction[$j] = $prediction[$j+1];
			$prediction[$j+1] = $temp;
		}
	}
}

foreach ($newPrediction as $i => $value) {
	for($j=0;$j<sizeof($newPrediction)-1;$j++) {
		if($newPrediction[$j][0]<$newPrediction[$j+1][0]){
			$temp = $newPrediction[$j];
			$newPrediction[$j] = $newPrediction[$j+1];
			$newPrediction[$j+1] = $temp;
		}
	}
}

foreach ($seren as $i => $value) {
	for($j=0;$j<sizeof($seren)-1;$j++) {
		if($seren[$j][0]<$seren[$j+1][0]){
			$temp = $seren[$j];
			$seren[$j] = $seren[$j+1];
			$seren[$j+1] = $temp;
		}
	}
}

// foreach ($prediction as $key => $value) {
// 	echo json_encode($value);
// }

// echo "<br>newPrediction<br>";
// foreach ($newPrediction as $key => $value) {
// 	echo json_encode($value);
// }

// echo "<br>new NEW Prediction<br>";
// foreach ($seren as $key => $value) {
// 	echo json_encode($value);
// }
$allPrediction = array();

$allPrediction['prediction'] = $prediction;
$allPrediction['newPrediction'] = $newPrediction;
$allPrediction['seren'] = $seren;

echo json_encode($allPrediction);


//echo $uid;
$something = 'http://127.0.0.1:8080/login?uid='.$uid;
$link = "<form action='".$something."' method='get'> <input type='submit' value='go back' /> </form>"; 
//echo $something;
mysql_close($conn);
?>

