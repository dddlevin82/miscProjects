#include "Grid.h"
#include "haar.h"
#include "WeakLearner.h"
#include "StrongLearner.h"
#include "math.h"
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

WeakLearner findWeakLearner(WeakLearner *lns, int nLns, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights) {
	vector<double> cuts = {-.5, -.4, -.3, -.2, -.1, 0, .1, .2, .3, .4, .5};
	double minErr = 10000000000000000;
	WeakLearner *minErrLn;
	for (int i=0; i<nLns; i++) {
		WeakLearner &ln = lns[i];
		double thisErr = ln.trainOnImgs(faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights, cuts);
		if (thisErr < minErr) {
			minErr = thisErr;
			minErrLn = &ln;
		}
	}
	return *minErrLn;

}

StrongLearner findStrongLearner(WeakLearner *lns, int nLns, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, int howmany) {
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
		selected.push_back(findWeakLearner(lns, nLns, faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights));
		updateWeights(selected[selected.size()-1], faces, nfaces, nonfaces, nnonfaces, faceWeights, nonfaceWeights);
	}
	StrongLearner s = StrongLearner(selected);
	free(faceWeights);
	free(nonfaceWeights);
	return s;
}

int main() {

	return 0;
}
