#include "Grid.h"
#include <stdio.h>
#include "haar.h"
#include "WeakLearner.h"
#include "StrongLearner.h"
#include <pthread.h>
#include "math.h"
#include "Window.h"
#include <algorithm>
#include <sstream>
#include <string>
#define NUMCOLS 30000 //1000
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
	fclose(fr);
	return imgs;	


}

double getSumErr(WeakLearner &ln, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights) {
	pair<vector<double>, vector<double> > errs = ln.yieldErrors(faces, nfaces, nonfaces, nnonfaces);
	vector<double> faceErrs = errs.first;
	vector<double> nonfaceErrs = errs.second;
	double innerProdFaces = dotProd(faceErrs, faceWeights);
	double innerProdNonFaces = dotProd(nonfaceErrs, nonfaceWeights);
	return innerProdFaces + innerProdNonFaces;
}

void updateWeights(WeakLearner &ln, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights, double sumErr) {
	pair<vector<double>, vector<double> > errs = ln.yieldErrors(faces, nfaces, nonfaces, nnonfaces);
	vector<double> faceErrs = errs.first;
	vector<double> nonfaceErrs = errs.second;
	//cout << "sum error is " << sumErr << endl;
	double beta = sumErr / (1 - sumErr);
	//cout << "beta is " << beta << endl;
	//cout << ln.faceErrors / (double) nfaces << " frac faces wrongs" << endl;
	//cout << ln.nonfaceErrors / (double) nnonfaces << " frac nonfaces wrongs" << endl;
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
		
		if (!(i%100000)) {
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

StrongLearner findStrongLearner(WeakLearner *lns, int nLns, WeakLearner *lnsSparse, int nlnsSparse, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, int howmany, FILE *f) {
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
		cout << "going to find weak" << endl;
		WeakLearner l = findWeakLearner(lnsSparse, nlnsSparse, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);
		double sumErr = getSumErr(l, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);	
		if (sumErr >= 0.5) {
			cout << "frac right is "  << (l.faceErrors + l.nonfaceErrors) / (double) (nfaces + nnonfaces)  << " and sum error is " << sumErr << ", moving to dense " << endl;
			l = findWeakLearner(lns, nLns, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);

			sumErr = getSumErr(l, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);	
		//	cout << "did dense" << endl;
			if (sumErr >= 0.5) {
		//		cout << "OMG DIVERGENCE" << endl;
			}
		} else {
			cout << "success with sparse" << endl;
		}
		l.sumErr = sumErr;
		selected.push_back(l);
		cout << "found weak learner " << i << endl;
		updateWeights(selected[selected.size()-1], faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights, sumErr);
		cout << selected[selected.size()-1].forOutput() << endl;
		fprintf(f, "%s\n", selected[selected.size()-1].forOutput().c_str());
	}
	StrongLearner s = StrongLearner(selected);
	free(faceWeights);
	free(nonfaceWeights);
	return s;
}

WeakLearner *realloc(WeakLearner *lns, int *curNum, int idx) {
	*curNum = *curNum + fmin(*curNum, 3000000);
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
			if (idx + 2 * rr * cc / step / step >= curNum) {
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
			if (idx + 2 * rr * cc / step / step >= curNum) {
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
	//cout << "assembled two's" << endl;
	//vertical three's
	for (int numCols = 3; numCols<=nc; numCols+=tristep) {
		for (int numRows=1; numRows<=nr; numRows+=step) {
			int c = 0;
			int cc = nc - numCols;
			int rr = nr - numRows;		
			if (idx + 2 * rr * cc / step / step >= curNum) {
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
			if (idx + 2 * rr * cc / step / step >= curNum) {
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
	//cout << "assembled three's" << endl;
	*numLearners = idx;
	return lns;
}


void train() {

	int numImgs = 1000;
	Grid *IMGSFACES = loadImages("../../../asIntFaces.txt", numImgs, 65, 65);
	Grid *IMGSNONFACES = loadImages("../../../asIntNonFaces.txt", numImgs, 65, 65);
	int numWeaks;
	int numWeaksSparse;
	WeakLearner *lns = assembleWeaks(IMGSFACES[0].nr, IMGSFACES[0].nc, &numWeaks, 1);
	WeakLearner *lnsSparse = assembleWeaks(IMGSFACES[0].nr , IMGSFACES[0].nc, &numWeaksSparse, 3);
	
	FILE *f = fopen("results.txt", "w");
	StrongLearner s = findStrongLearner(lns, numWeaks, lnsSparse, numWeaksSparse, IMGSFACES, numImgs, IMGSNONFACES, numImgs, 75, f);
	for (unsigned int i=0; i<s.weakLearners.size(); i++) {
		//s.weakLearners[i].print();	
	}

	fclose(f);
	
}


vector<WeakLearner> loadWeaks(string fn) {
	FILE *f = fopen(fn.c_str(), "rt");
	char line[200];
	vector<WeakLearner> lns;
	while (fgets(line, 200, f) != NULL) {
		string s = string(line);
		double vals[9];
		int numVals = 0;
		stringstream ss(s);
		double tmp;
		while (ss>>tmp) {
			vals[numVals] = tmp;
			numVals++;
		}
		if (numVals == 9) {
			lns.push_back(WeakLearner(vals));
		}
	}
	fclose(f);
	return lns;


}


void buildStrongLearners() {
	int nface = 1000;
	Grid *IMGSFACE = loadImages("../../../asIntFaces.txt", nface, 65, 65);
	Grid *IMGSNONFACES = loadImages("../../../asIntNonFaces.txt", nface, 65, 65);
	vector<int> weaksPer = {3, 5, 10, 20, 40, 75};
	vector<WeakLearner> weaks = loadWeaks("out.txt");
	vector<StrongLearner> lns;
	for (unsigned int i=0; i<weaksPer.size(); i++) {
		vector<WeakLearner> forStr;
		forStr.insert(forStr.begin(), weaks.begin(), weaks.begin() + weaksPer[i]);
		StrongLearner s = StrongLearner(forStr);
		s.learnOffset(IMGSFACE, nface, .02, IMGSNONFACES, nface);
		s.forOutput();
		
	}
}


vector<StrongLearner> loadStrongs(string fn, vector<WeakLearner> &weaks) {
	FILE *f = fopen(fn.c_str(), "rt");
	char line[200];
	vector<StrongLearner> strongs;
	while (fgets(line, 200, f) != NULL) {
		string s = string(line);
		double vals[2];
		int numVals = 0;
		stringstream ss(s);
		double tmp;
		while (ss>>tmp) {
			vals[numVals] = tmp;
			numVals++;
		}
		if (numVals == 2) {
			strongs.push_back(StrongLearner(vals, weaks));
		}
	}
	return strongs;
}


double avgDbl(double a, double b) {
	return .5 * (a + b);
}

FWindow mergeWindows(FWindow &a, FWindow &b) {
	double centerRow = avgDbl(a.pos.y + a.trace.y * .5, b.pos.y + b.trace.y * .5);
	double centerCol = avgDbl(a.pos.x + a.trace.x * .5, b.pos.x + b.trace.x * .5);
	double avgR = avgDbl(a.trace.y, b.trace.y);
	double avgC = avgDbl(a.trace.x, b.trace.x);
	double roughTotalSpanR = fabs(a.pos.y - b.pos.y) + avgR;
	double roughTotalSpanC = fabs(a.pos.x - b.pos.x) + avgC;
	double newdr = avgDbl(avgR, roughTotalSpanR);
	double newdc = avgDbl(avgC, roughTotalSpanC);
	int rmin = centerRow - .5 * newdr + .5;
	int rmax = centerRow + .5 * newdr + .5;
	int cmin = centerCol - .5 * newdc + .5;
	int cmax = centerCol + .5 * newdc + .5;
	return FWindow(rmin, rmax, cmin, cmax);
}

bool xsOverlap(Vector posA, Vector posB, Vector traceA) {
	return posA.x <= posB.x && posA.x + traceA.x >= posB.x;
}
bool ysOverlap(Vector posA, Vector posB, Vector traceA) {
	return posA.y <= posB.y && posA.y + traceA.y >= posB.y;
}
bool windowsOverlap(FWindow &a, FWindow &b) {
	return (xsOverlap(a.pos, b.pos, a.trace) || xsOverlap(b.pos, a.pos, b.trace)) && (ysOverlap(a.pos, b.pos, a.trace) || ysOverlap(b.pos, a.pos, b.trace));
}

FWindow maxOfWindows(vector<FWindow> &wins) {
	int minX = wins[0].pos.x;
	int maxX = wins[0].pos.x;
	int minY = wins[0].pos.y;
	int maxY = wins[0].pos.y;
	for (unsigned int i=0, ii=wins.size(); i<ii; i++) {
		FWindow &a = wins[i];
		minX = fmin(minX, a.pos.x);
		maxX = fmax(maxX, a.pos.x + a.trace.x);
		minY = fmin(minY, a.pos.y);
		maxY = fmax(maxY, a.pos.y + a.trace.y);
	}
	return FWindow(minY, maxY, minX, maxX);

}


bool overlapsWithMega(vector<FWindow> &mega, FWindow working) {
	for (unsigned int i=0, ii=mega.size(); i<ii; i++) {
		if (windowsOverlap(mega[i], working)) {
			return true;
		}
	}
	return false;
}


vector<FWindow> procMegas(vector<vector<FWindow> > &megas) {
	vector<FWindow> combd;
	for (unsigned int i=0; i<megas.size(); i++) {
		combd.push_back(maxOfWindows(megas[i]));
	}
	return combd;
}

vector<FWindow> combineSubWins(vector<FWindow> subwins, bool isLast) {
	int numErased = 0;
	for (int i=(int)subwins.size()-1; i>=1; i--) {
		FWindow working = subwins[i];
		for (int j=i-1; j>=0; j--) {
			FWindow &test = subwins[j];

			
			if (working.pos.dist(test.pos) < working.span / 3) {
				working = mergeWindows(working, test);
				subwins.erase(subwins.begin() + i);
				numErased ++;
				if (!(numErased%10000)) {
					//cout << "erased " << numErased << endl;
				}
				subwins[j] = working;
				break;
			}
			

		}
	}
	if (!isLast) {
		vector<FWindow> finals;
		vector<vector<FWindow> > megaWindows;
		for (int i=(int)subwins.size()-1; i>=0; i--) {
			FWindow working = subwins[i];
			bool foundOverlapping = false;
			for (unsigned int j=0; j<megaWindows.size(); j++) {
				if (overlapsWithMega(megaWindows[j], working)) {
					megaWindows[j].push_back(working);
					foundOverlapping = true;
					break;
				}

			}
			if (!foundOverlapping) {
				vector<FWindow> mega;
				mega.push_back(working);
				megaWindows.push_back(mega);
			}
		}
		return procMegas(megaWindows);
	} else {
		return subwins;
	}

}

int depth = 0;
vector<FWindow> findWindows(vector<StrongLearner> strongs, vector<FWindow> wins, Grid *IMG) {
	vector<FWindow> subWins;
	int minLen = 55;
	int maxLen = 70;
	int stride = 5;
	StrongLearner s = strongs[0];
	for (unsigned int i=0, ii=wins.size(); i<ii; i++) {
		FWindow win = wins[i];

		for (int nrows = minLen; nrows<=maxLen; nrows+=stride) {
			for (int ncols = minLen; ncols<=maxLen; ncols+=stride) {
				int maxrow = win.pos.y + win.trace.y - nrows - 1;
				int maxcol = win.pos.x + win.trace.x - ncols - 1;
				for (int row=win.pos.y; row<maxrow; row+=5) {
					for (int col=win.pos.x; col<maxcol; col+=5) {
						/*
						if (depth==1) {
							cout << "checking one " << endl;	
						}
						*/
						if (s.evalImg(*IMG, row, col, nrows, ncols)) {
							subWins.push_back(FWindow(row, row + nrows, col, col + ncols));
						//	cout << "got face " << subWins.size() << endl;
						} 
					}
				}
			}

		}
	}
	int orig = subWins.size();
	//cout << "entering combine windows with " << orig << " windows" << endl;
	vector<FWindow> combined = combineSubWins(subWins, strongs.size()==1);
	//cout << "combed from " << orig << " to " << combined.size() << endl;
	if (strongs.size() == 1) {
		return combined;
	} else {
		//cout << "recursing" << endl;
		vector<StrongLearner> remaining;
		depth++;
		remaining.insert(remaining.begin(), strongs.begin()+1, strongs.end());
		return findWindows(remaining, combined, IMG);
	}
}

void spewFaces(vector<FWindow> &faces) {
	for (unsigned int i=0; i<faces.size(); i++) {
		faces[i].spew();
	}
}


void test() {
	vector<WeakLearner> weaks = loadWeaks("out.txt");
	vector<StrongLearner> strongs = loadStrongs("strongs.txt", weaks);
	//cout << strongs.size() << " strongs " << endl;
	Grid *IMGTEST = loadImages("../../../asIntClass.txt", 1, 1281, 1601);
	vector<FWindow> fullWindow;
	fullWindow.push_back(FWindow(1, 1281, 1, 1601));
	vector<FWindow> faces = findWindows(strongs, fullWindow, &(IMGTEST[0]));
	spewFaces(faces);
}


int main() {
	//train();
	//buildStrongLearners();
	test();
	return 0;
}
