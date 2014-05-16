#ifndef WEAK_H
#define WEAK_H
#include <vector>
#include <utility>
#include <climits>
#include "haar.h"
#include <sstream>
#include "Grid.h"
class WeakLearner {
	public:
		double (*haar) (Grid &, int, int, int, int);
		int p;
		WeakLearner(double (*haarArg) (Grid &, int, int, int, int), int, double, double, double, double, vector<double>);
		WeakLearner(double args[9]);
		double cut;
		double rmin;
		double rmax;
		double cuts[11];
		int nCuts;
		double cmin;
		double cmax;
		double weight;
		int faceErrors;
		int nonfaceErrors;
		double sumErr;
		void print();
		string forOutput();
		double trainOnImgs(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights);
		pair<vector<double>, vector<double> > yieldErrors(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces);
		bool evalImgTrain(Grid &img, double cut);
		bool evalImg(Grid &img, int winRow, int winCol, int dWinRow, int dWinCol);
};
extern bool spew;
#endif
