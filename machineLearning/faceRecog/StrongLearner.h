#ifndef STRONG_H
#define STRONG_H
#include <vector>
#include "WeakLearner.h"

class StrongLearner {
	public:
		vector<WeakLearner> weakLearners;
		void normalizeWeights();
		double offset = 0;
		StrongLearner(vector<WeakLearner>);
		void learnOffset(Grid *faces, int nFaces, double maxFalseNegFrac);
		bool evalImgLearn(Grid &face, curOffset);
		bool evalImg(Grid &face, int winRow, int winCol, int dWinRow, int dWinCol);
};
#endif
