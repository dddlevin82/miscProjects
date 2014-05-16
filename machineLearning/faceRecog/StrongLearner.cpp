#include "StrongLearner.h"

StrongLearner::StrongLearner(vector<WeakLearner> weaks) {
	weakLearners = weaks;
	normalizeWeights();
}

StrongLearner::StrongLearner(double args[2], vector<WeakLearner> &weaks) {
	int numWeaks = args[0];
	offset = args[1];
	for (unsigned int i=0; i<weaks.size(); i++) {
		weakLearners.push_back(weaks[i]);
	}
	normalizeWeights();
}


void StrongLearner::normalizeWeights() {
	double totalWeight = 0;
	for (unsigned int i=0; i<weakLearners.size(); i++) {
		totalWeight += weakLearners[i].weight;
	}

	for (unsigned int i=0; i<weakLearners.size(); i++) {
		weakLearners[i].weight /= totalWeight;
	}
}

void StrongLearner::learnOffset(Grid *faces, int nFaces, double maxFalseNegFrac) {
	double curOffset = .5;
	double dOffset = curOffset / 10;
	double wrongs = nFaces;
	while (wrongs / nFaces > maxFalseNegFrac) {
		wrongs = 0;
		for (int i=0; i<nFaces; i++) {
			Grid &face = faces[i];
			if (!evalImgLearn(face, curOffset)) {
				wrongs++;
			}
		}
	//	cout << "frac wrong " << wrongs/(double)nFaces << " with offset " << curOffset << endl;

		curOffset -= dOffset;
	}
	curOffset += dOffset;
	offset = curOffset;	
}

void StrongLearner::forOutput() {
	cout << weakLearners.size() << " " << offset << endl;
}

bool StrongLearner::evalImgLearn(Grid &face, double curOffset) {
	double sumWeaks = 0;
	for (unsigned int i=0; i<weakLearners.size(); i++) {
		sumWeaks += weakLearners[i].evalImg(face, 0, 0, (int) face.nr - 1, (int) face.nc - 1) * weakLearners[i].weight; //IS THIS RIGHT?
	}
	return sumWeaks > curOffset;
}

bool StrongLearner::evalImg(Grid &face, int winRow, int winCol, int dWinRow, int dWinCol) {
	double sumWeaks = 0;
	for (unsigned int i=0; i<weakLearners.size(); i++) {
		sumWeaks += weakLearners[i].evalImg(face, winRow, winCol, dWinRow, dWinCol) * weakLearners[i].weight;
	}
	return sumWeaks > offset;

}
