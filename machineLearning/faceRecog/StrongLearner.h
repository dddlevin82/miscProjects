#ifndef STRONG_H
#define STRONG_H
#include <vector>
#include "WeakLearner.h"
#include "Grid.h"
class StrongLearner {
	public:
		vector<WeakLearner> weakLearners;
		void normalizeWeights();
		double offset = 0;
		StrongLearner(vector<WeakLearner>);
		StrongLearner(double args[2], vector<WeakLearner> &);
		void forOutput();
		void learnOffset(Grid *faces, int nFaces, double maxFalseNegFrac, Grid *, int);
		bool evalImgLearn(Grid &face, double curOffset);
		bool evalImg(Grid &face, int winRow, int winCol, int dWinRow, int dWinCol);
};
#endif
