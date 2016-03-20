from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import Imputer
from numpy import genfromtxt, savetxt, fromstring
import numpy as np
def main():
    #create the training & test sets, skipping the header row with [1:]
    #f8 means float
    fileName = 'ml-latest-small/movies.csv'
    dataset = genfromtxt(open(fileName,'r'), delimiter=';', dtype="S50")
    movieid = dataset[:,0]
    movie = dataset[:,1]
    top = []
    j = 0
    for data in dataset:
    	#tagset = np.core.defchararray.split(data[2],sep="|")
	tagset = data[2].split("|")
	for tag in tagset:
		print data[0] +", "+ tag
			#top.insert(j,idtag)
			#j +=1

    #savetxt('ml-latest/genre.csv',top,delimiter=',',fmt='%s,%s')
   
    #savetxt('data/submission.csv', predicted_probs, delimiter=',', fmt='%d,%f', 
     #       header='Id,Probability', comments = '')
   
if __name__=="__main__":
    main()
