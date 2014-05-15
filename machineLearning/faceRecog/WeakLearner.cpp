/*
class WeakLearner {
	public:
		bool (*haar) (some vars, need to make it work for sliding window);
		int p;
		double cut;
		double rmin;
		double rmax;
		double cmin;
		double cmax;
		double weight;
		double trainOnImgs(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights, vector<double> cuts);
		pair<double> yieldErrors(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces);
		bool evalImgTrain(Grid *img, double cut);
		bool evalImg(Grid *img, ###SLIDING WINDOW STUFF###);
}
*/
WeakLearner::WeakLearner(double (*haarArg) (Grid &, int, int, int, int, double, double, double, double), int p_, double rmin_, double rmax_, double cmin_, double cmax_) {
	haar = haarArg;
	p = p_;
	rmin = rmin_;
	rmax = rmax_;
	cmin = cmin_;
	cmax = cmax_;
	cut = 0;
	weight = 0;

}
