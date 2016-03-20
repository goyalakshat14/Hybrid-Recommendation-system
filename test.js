var p = [[0,2,9],[5,6]];
var q = [1,3,5];
var t = [];
t.push(p);
t.push(q);
for(value in t)
{
	for(v in t[value])
	{
		console.log(t[value][v]);
	}
}
/*
console.log(t);
for(value in p)
	for(v in p[value])
		console.log(p[value][v]);*/