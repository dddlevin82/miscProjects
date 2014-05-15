#include "Grid.h"
#include "haar.h"
#include "WeakLearner.h"
#include "StrongLearner.h"

double dotProd(vector<double> &xs, double *ys) { //gaaah so ugly
	double sum = 0;
	for (unsigned int i=0, ii=xs.size(); i<ii; i++) {
		sum += xs[i] * ys[i];
	}
	return sum;
}

void updateWeights(WeakLearner &ln, Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights) {
	pair<vector<double>, vector<double> > errs = ln.yieldErrors(faces, nfaces, nonfaces, nnonfaces);
	faceErrs = errs.first;
	nonfaceErrs = errs.second;
	innerProdFaces = dotProd(
}




int main() {

	return 0;
}
