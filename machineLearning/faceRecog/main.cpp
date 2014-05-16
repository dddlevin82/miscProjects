#include "Grid.h"
#include <stdio.h>
#include "haar.h"
#include "WeakLearner.h"
#include "StrongLearner.h"
#include <pthread.h>
#include "math.h"
#include <sstream>
#include <string>
#define NUMCOLS 1000
#define NUMTHREADS 4 
bool spew = false;

double dotProd(vector<double> &xs, double *ys) { //gaaah so ugly
	double sum = 0;
	for (unsigned int i=0, ii=xs.size(); i<ii; i++) {
		sum += xs[i] * ys[i];
	}
	return sum;
}


double lameSum(double *xs, int nx) {
	double sum = 0;
	for (int i=0; i<nx; i++) {
		sum += xs[i];
	}
	return sum;
}


Grid *loadImages(string fn, int n, int numRow, int numCol) {
	Grid *imgs = (Grid *) malloc(sizeof(Grid) * n);

	FILE *fr = fopen(fn.c_str(), "rt");
	char line[ NUMCOLS ];
	Grid g = Grid(numRow, numCol);
	int idx = 0;
	int row = 0;
	while(fgets(line, NUMCOLS, fr) != NULL) {
		string s = string(line);
		
		if (s.find("END") != string::npos) {
			

			imgs[idx] = g;
			if (idx == n-1) {
				break;
			}
			row = 0;
			idx++;
		} else {
		//	cout << "new row" << endl;
		//	cout << s << endl;
			stringstream ss(s);
			double tmp;
			int col = 0;
			while (ss>>tmp) {
				g[row][col] = tmp;			
		//		cout << tmp << ", ";
				col++;
			}
		//	cout << endl;
			cout << "finished row " << row << endl;
			row ++;
			
		}


	}
	cout << "face value" << endl;
	for (int i=0; i<65; i++) {
		for (int j=0; j<65; j++) {
			cout << g[i][j] << ", ";
		}
		cout << endl;
	}

	return imgs;	


}

void updateWeights(WeakLearner &ln, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights) {
	pair<vector<double>, vector<double> > errs = ln.yieldErrors(faces, nfaces, nonfaces, nnonfaces);
	vector<double> faceErrs = errs.first;
	vector<double> nonfaceErrs = errs.second;
	double innerProdFaces = dotProd(faceErrs, faceWeights);
	double innerProdNonFaces = dotProd(nonfaceErrs, nonfaceWeights);
	double sumErr = innerProdFaces + innerProdNonFaces;
	double beta = sumErr / (1 - sumErr);
	ln.weight = log(1 / beta);
	for (int i=0; i<nfaces; i++) {
		if (faceErrs[i]) {
			faceWeights[i] *= beta;
		}
	}
	for (int i=0; i<nnonfaces; i++) {
		if (nonfaceErrs[i]) {
			nonfaceWeights[i] *= beta;
		}
	}
	double allWeights = lameSum(faceWeights, nfaces) + lameSum(nonfaceWeights, nnonfaces);
	for (int i=0; i<nfaces; i++) {
		faceWeights[i] /= allWeights;
	}
	for (int i=0; i<nnonfaces; i++) {
		nonfaceWeights[i] /= allWeights;
	}
}

struct thread_info {
	WeakLearner *lns;
	int lnMin;
	int lnMax;
	int nLns;
	Grid *faces;
	int nfaces;
	Grid *nonfaces;
	int nnonfaces;
	double *faceWeights;
	double *nonfaceWeights;
	int tid;
	WeakLearner *(*bests)[NUMTHREADS];
	double (*bestErrors)[NUMTHREADS];
};



void *runWeaks(void *arg) {
	thread_info t = *((thread_info *) arg);
	double minErr = 1000000000000000000;
	WeakLearner *best;
	for (int i=t.lnMin; i<t.lnMax; i++) {
		
		if (!(i%1000)) {
			cout << i << " of " << t.nLns << endl;
		}
		double thisErr = t.lns[i].trainOnImgs(t.faces, t.nfaces, t.nonfaces, t.nnonfaces, t.faceWeights, t.nonfaceWeights);
		if (thisErr < minErr) {
			minErr = thisErr;
			best = &t.lns[i];
		}
	}
	(*t.bests)[t.tid] = best;
	(*t.bestErrors)[t.tid] = minErr;
	return 0;	
	
}


WeakLearner findWeakLearner(WeakLearner *lns, int nLns, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights) {
	thread_info infos[NUMTHREADS];
	WeakLearner *bests[NUMTHREADS];
	double bestErrors[NUMTHREADS];
	pthread_t threads[NUMTHREADS];
	for (int i=0; i<NUMTHREADS; i++) {
		thread_info t;
		t.lns = lns;
		t.nLns = nLns;
		t.lnMin = (i * nLns) / NUMTHREADS;
		t.lnMax = ((i+1) * nLns) / NUMTHREADS;
		t.faces = faces;
		t.nfaces = nfaces;
		t.nonfaces = nonfaces;
		t.nnonfaces = nnonfaces;
		t.faceWeights = faceWeights;
		t.nonfaceWeights = nonfaceWeights;
		t.tid = i;
		t.bests = &bests;
		t.bestErrors = &bestErrors;
		infos[i] = t;
		pthread_create(&threads[i], NULL, &runWeaks, (void *) &infos[i]);
	}
	for (int i=0; i<NUMTHREADS; i++) {
		pthread_join(threads[i], NULL);
	}

	WeakLearner *minErrLn = bests[0];
	double minError = bestErrors[0];

	for (int i=0; i<NUMTHREADS; i++) {
		if (bestErrors[i] < minError) {
			minError = bestErrors[i];
			minErrLn = bests[i];
		}
	}
	/*
	for (int i=0; i<nLns; i++) {
		WeakLearner &ln = lns[i];

		double thisErr = ln.trainOnImgs(faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights, cuts);
		if (thisErr < minErr) {
			minErr = thisErr;
			minErrLn = &ln;
		}
		if (!(i%1000)) {
			cout << i << " of " << nLns << endl;
		}
	}*/
	return *minErrLn;

}

StrongLearner findStrongLearner(WeakLearner *lns, int nLns, WeakLearner *lnsSparse, int nlnsSparse, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, int howmany) {
	vector<WeakLearner> selected;

	int totalItems = nfaces + nnonfaces;
	double fw = (double) nfaces / totalItems;
	double nfw = (double) nnonfaces / totalItems;
	double *faceWeights = (double *) malloc(nfaces * sizeof(double));
	double *nonfaceWeights = (double *) malloc(nnonfaces * sizeof(double));
	for (int i=0; i<nfaces; i++) {
		faceWeights[i] = fw;

	}
	for (int i=0; i<nnonfaces; i++) {
		nonfaceWeights[i] = nfw;
	}
	for (int i=0; i<howmany; i++) {
		cout << "going to find weak" << endl;cout.flush();
		WeakLearner l = findWeakLearner(lnsSparse, nlnsSparse, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);
		/*
		if ((l.faceErrors + l.nonfaceErrors) / (double) (nfaces + nnonfaces) >= 0.5) {
			cout << "frac right is "  << (l.faceErrors + l.nonfaceErrors) / (double) (nfaces + nnonfaces)  << ", moving to dense " << endl;
			l = findWeakLearner(lns, nLns, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);
			cout << "did dense" << endl;
			if ((l.faceErrors + l.nonfaceErrors) / (double) (nfaces + nnonfaces) >= 0.5) {
				cout << "OMG DIVERGENCE" << endl;
			}
		} else {
			cout << "success with sparse" << endl;
		}*/
		selected.push_back(l);
		updateWeights(selected[selected.size()-1], faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);
	}
	StrongLearner s = StrongLearner(selected);
	free(faceWeights);
	free(nonfaceWeights);
	return s;
}

WeakLearner *realloc(WeakLearner *lns, int *curNum, int idx) {
	*curNum = *curNum + fmin(*curNum, 1000000);
	WeakLearner *newLns = (WeakLearner *) malloc(*curNum * sizeof(WeakLearner));

	memcpy(newLns, lns, sizeof(WeakLearner) * (idx+1));
	free(lns);
	return newLns;
}

WeakLearner *assembleWeaks(int nr, int nc, int *numLearners, int step) {
	int curNum = 100000;
	WeakLearner *lns = (WeakLearner *) malloc(curNum * sizeof(WeakLearner));
	int idx = 0;
	double fnr = nr;
	double fnc = nc;
	int dubstep = 2*step;
	vector<double> negPThetas = {0, .1, .2, .3, .4, .5};
	vector<double> posPThetas = {-.5, -.4, -.3, -.2, -.1, 0};
	for (int numCols = 2; numCols<nc+1; numCols+=dubstep) {
		for (int numRows = 1; numRows<nr+1; numRows+=step) {
			int c = 0;
			int cc = nc - numCols;
			int rr = nr - numRows;
			if (idx + 2 * rr * cc >= curNum) {
				lns = realloc(lns, &curNum, idx);
			}
			for (; c<cc; c+=step) {
				int r = 0;
				for (; r<rr; r+=step) {
					double cMinFrac = c / fnc;
					double cMaxFrac = (c + numCols) / fnc;
					double rMinFrac = r / fnr;
					double rMaxFrac = (r + numRows) / fnr;
					lns[idx] = WeakLearner(&haarTwoVert, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, posPThetas);
					lns[idx+1] = WeakLearner(&haarTwoVert, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, negPThetas);
					idx += 2;
				}
			}
		}
	
	}
	for (int numRows = 2; numRows<nr+1; numRows+=dubstep) {
		for (int numCols = 1; numCols<nc+1; numCols+=step) {
			int c = 0;
			int cc = nc - numCols;
			int rr = nr - numRows;
			if (idx + 2 * rr * cc >= curNum) {
				lns = realloc(lns, &curNum, idx);
			}
			for (; c<cc; c+=step) {
				int r = 0;
				for (; r<rr; r+=step) {
					double cMinFrac = c / fnc;
					double cMaxFrac = (c + numCols) / fnc;
					double rMinFrac = r / fnr;
					double rMaxFrac = (r + numRows) / fnr;
					lns[idx] = WeakLearner(&haarTwoHoriz, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, posPThetas);
					lns[idx+1] = WeakLearner(&haarTwoHoriz, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, negPThetas);
					idx += 2;
				}
			}
		}
	
	}
	*numLearners = idx;
	return lns;
}


int main() {
	int numImgs = 1;
	Grid *IMGSFACES = loadImages("../../../asIntFaces.txt", numImgs, 65, 65);
	//Grid *IMGSNONFACES = loadImages("../../../asIntNonFaces.txt", numImgs, 65, 65);
	int numWeaks;
	int numWeaksSparse;
//	WeakLearner *lns = assembleWeaks(IMGSFACES[0].nr, IMGSFACES[0].nc, &numWeaks, 1);
//	WeakLearner *lnsSparse = assembleWeaks(IMGSFACES[0].nr , IMGSFACES[0].nc, &numWeaksSparse, 1);
	WeakLearner *myWk = (WeakLearner *) malloc(sizeof(WeakLearner));
	vector<double> cuts = {0, .1, .2, .3, .4, .5};
	myWk[0] = WeakLearner(haarTwoHoriz, -1, 0, .375, .046, .86, cuts);
	vector<int> numLearners = {1};
	/*
	cout << "face value" << endl;
	for (int i=0; i<65; i++) {
		for (int j=0; j<65; j++) {
			cout << IMGSFACES[0][i][j] << ", ";
		}
		cout << endl;
	}*/
	//StrongLearner s = findStrongLearner(myWk, 1, myWk, 1, IMGSFACES, numImgs, IMGSNONFACES, numImgs, numLearners[numLearners.size()-1]);
	//StrongLearner s = findStrongLearner(lns, numWeaks, lnsSparse, numWeaksSparse, IMGSFACES, numImgs, IMGSNONFACES, numImgs, numLearners[numLearners.size()-1]);
	//s.weakLearners[0].print();	
	return 0;
}
