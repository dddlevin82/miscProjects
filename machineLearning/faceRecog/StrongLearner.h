#include <vector>
#include "WeakLearner.h"

class StrongLearner {
	public:
		vector<WeakLearner> weakLearners;
		void normalizeWeights();
		double offset = 0;
		StrongLearner(vector<WeakLearner>);
		void learnOffset(Grid *faces, int nFaces, double maxFalseNegFrac);
};
