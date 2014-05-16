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
#define NUMTHREADS 8 
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
			stringstream ss(s);
			double tmp;
			int col = 0;
			while (ss>>tmp) {
				g[row][col] = tmp;			
				col++;
			}
			row ++;
			
		}


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
	cout << "sum error is " << sumErr << endl;
	double beta = sumErr / (1 - sumErr);
	cout << "beta is " << beta << endl;

	ln.weight = log(1 / beta);
	for (int i=0; i<nfaces; i++) {
		if (!faceErrs[i]) {
			faceWeights[i] *= beta;
		}
	}
	for (int i=0; i<nnonfaces; i++) {
		if (!nonfaceErrs[i]) {
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
	/*
	cout << "new nonface weights" << endl;
	for (int i=0; i<nnonfaces; i++) {
		cout << nonfaceWeights[i] << ", ";
	}
	cout << "and errs " << endl;
	for (int i=0; i<nnonfaces; i++) {
		cout << nonfaceErrs[i] << ", ";
	}
	cout << endl;
	*/
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
		
		if (!(i%10000)) {
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

	return *minErrLn;

}

StrongLearner findStrongLearner(WeakLearner *lns, int nLns, WeakLearner *lnsSparse, int nlnsSparse, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, int howmany) {
	vector<WeakLearner> selected;

	int totalItems = nfaces + nnonfaces;
	double weight  = 1 / (double) totalItems;
	double *faceWeights = (double *) malloc(nfaces * sizeof(double));
	double *nonfaceWeights = (double *) malloc(nnonfaces * sizeof(double));

	for (int i=0; i<nfaces; i++) {
		faceWeights[i] = weight;

	}
	for (int i=0; i<nnonfaces; i++) {
		nonfaceWeights[i] = weight;
	}
//	for (int i=0; i<nnonfaces; i++) {
//		cout << nonfaceWeights[i] << ", ";
//	}
//	cout << endl;
	for (int i=0; i<howmany; i++) {
		WeakLearner l = findWeakLearner(lnsSparse, nlnsSparse, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);
		
		if ((l.faceErrors + l.nonfaceErrors) / (double) (nfaces + nnonfaces) >= 0.5) {
			cout << "frac right is "  << (l.faceErrors + l.nonfaceErrors) / (double) (nfaces + nnonfaces)  << ", moving to dense " << endl;
			l = findWeakLearner(lns, nLns, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);
			cout << "did dense" << endl;
			if ((l.faceErrors + l.nonfaceErrors) / (double) (nfaces + nnonfaces) >= 0.5) {
				cout << "OMG DIVERGENCE" << endl;
			}
		} else {
			cout << "success with sparse" << endl;
		}
		selected.push_back(l);
		updateWeights(selected[selected.size()-1], faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);
	}
	StrongLearner s = StrongLearner(selected);
	free(faceWeights);
	free(nonfaceWeights);
	return s;
}

WeakLearner *realloc(WeakLearner *lns, int *curNum, int idx) {
	*curNum = *curNum + fmin(*curNum, 2000000);
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
	int tristep = 3*step;
	vector<double> negPThetas = {0, .1, .2, .3, .4, .5};
	vector<double> posPThetas = {-.5, -.4, -.3, -.2, -.1, 0};
	for (int numCols = 2; numCols<=nc; numCols+=dubstep) {
		for (int numRows = 1; numRows<=nr; numRows+=step) {
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
	for (int numRows = 2; numRows<=nr; numRows+=dubstep) {
		for (int numCols = 1; numCols<=nc; numCols+=step) {
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
	cout << "assembled two's" << endl;
	//vertical three's
	for (int numCols = 3; numCols<=nc; numCols+=tristep) {
		for (int numRows=1; numRows<=nr; numRows+=step) {
			int c = 0;
			int cc = nc - numCols;
			int rr = nr - numRows;		
			if (idx + 2 * rr * cc >= curNum) {
				cout << "going to alloc " << endl;
				lns = realloc(lns, &curNum, idx);
			}
			for (; c<cc; c+=step) {
				int r = 0;
				for (; r<rr; r+=step) {
					double cMinFrac = c / fnc;
					double cMaxFrac = (c + numCols) / fnc;
					double rMinFrac = r / fnr;
					double rMaxFrac = (r + numRows) / fnr;
					lns[idx] = WeakLearner(&haarThreeVert, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, posPThetas);
					lns[idx+1] = WeakLearner(&haarThreeVert, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, negPThetas);
					idx += 2;
				}
			}
		}
	}
	//horizontal three's
	for (int numRows= 3; numRows<=nr; numRows+=tristep) {
		for (int numCols=1; numCols<=nc; numCols+=step) {
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
					lns[idx] = WeakLearner(&haarThreeHoriz, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, posPThetas);
					lns[idx+1] = WeakLearner(&haarThreeHoriz, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, negPThetas);
					idx += 2;
				}
			}
		}
	}
	//four's
	for (int numRows=2; numRows<=nr; numRows+=dubstep) {
		for (int numCols=2; numCols<=nc; numCols+=dubstep) {
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
					lns[idx] = WeakLearner(&haarFour, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, posPThetas);
					lns[idx+1] = WeakLearner(&haarFour, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac, negPThetas);
					idx += 2;
				}
			}
		}
	}
	cout << "assembled three's" << endl;
	*numLearners = idx;
	return lns;
}


int main() {
	int numImgs = 300;
	Grid *IMGSFACES = loadImages("../../../asIntFaces.txt", numImgs, 65, 65);
	Grid *IMGSNONFACES = loadImages("../../../asIntNonFaces.txt", numImgs, 65, 65);
	int numWeaks;
	int numWeaksSparse;
	WeakLearner *lns = assembleWeaks(IMGSFACES[0].nr, IMGSFACES[0].nc, &numWeaks, 1);
	WeakLearner *lnsSparse = assembleWeaks(IMGSFACES[0].nr , IMGSFACES[0].nc, &numWeaksSparse, 3);
	//WeakLearner *myWk = (WeakLearner *) malloc(sizeof(WeakLearner));
	//vector<double> cuts = {0, .1, .2, .3, .4, .5};
	//myWk[0] = WeakLearner(haarTwoHoriz, -1, 0, .1875, .046, .86, cuts);
	vector<int> numLearners = {5};
	//StrongLearner s = findStrongLearner(myWk, 1, myWk, 1, IMGSFACES, numImgs, IMGSNONFACES, numImgs, numLearners[numLearners.size()-1]);
	StrongLearner s = findStrongLearner(lns, numWeaks, lnsSparse, numWeaksSparse, IMGSFACES, numImgs, IMGSNONFACES, numImgs, numLearners[numLearners.size()-1]);
	s.weakLearners[0].print();	
	s.weakLearners[1].print();
	return 0;
}
