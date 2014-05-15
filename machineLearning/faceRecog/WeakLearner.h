#ifndef WEAK_H
#define WEAK_H
#include <vector>
#include <utility>
#include <climits>
class WeakLearner {
	public:
		double (*haar) (Grid &, int, int, int, int);
		int p;
		WeakLearner(double (*haarArg) (Grid &, int, int, int, int), int, double, double, double, double)
		double cut;
		double rmin;
		double rmax;
		double cmin;
		double cmax;
		double weight;
		double trainOnImgs(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights, vector<double> cuts);
		pair<vector<int>, vector<int> > yieldErrors(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces);
		bool evalImgTrain(Grid *img, double cut);
		bool evalImg(Grid *img, winRow, winCol, dWinRow, dWinCol);
}
#endif
