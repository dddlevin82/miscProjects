

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
		vector<double> yieldErrors(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces);
		bool evalImgTrain(Grid *img, double cut);
		bool evalImg(Grid *img, ###SLIDING WINDOW STUFF###);
}
