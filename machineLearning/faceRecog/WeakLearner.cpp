#include "WeakLearner.h"


WeakLearner::WeakLearner(double (*haarArg) (Grid &, int, int, int, int), int p_, double rmin_, double rmax_, double cmin_, double cmax_, vector<double> cuts_) {
	haar = haarArg;
	p = p_;
	rmin = rmin_;
	rmax = rmax_;
	cmin = cmin_;
	cmax = cmax_;
	cut = 0;
	weight = 0;
	nCuts = cuts_.size();
	for (unsigned int i=0, ii=cuts_.size(); i<ii; i++) {
		cuts[i] = cuts_[i];
	}

}

WeakLearner::WeakLearner(double args[9]) {

	rmin = args[0];
	rmax = args[1];
	cmin = args[2];
	cmax = args[3];
	p = (int) args[4];
	cut = args[5];
	weight = args[6];
	sumErr = args[7];
	int fId = args[8];
	if (fId == 1) {
		haar = &haarTwoHoriz;
	} else if (fId == 2) {
		haar = &haarTwoVert;
	} else if (fId == 3) {
		haar = &haarThreeHoriz;
	} else if (fId == 4) {
		haar = &haarThreeVert;
	} else if (fId == 5) {
		haar = haarFour;
	} else {
		cout << "AAAAAAAAAAAAAHHHHHHHHHHHH" << endl;
	}
	faceErrors = 0;
	nonfaceErrors = 0;
}

double WeakLearner::trainOnImgs(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces, double *faceWeights, double *nonfaceWeights) {
	double faceError;
	double nonfaceError;
	int idxErrMin = -1;
	double errMin = INT_MAX; //meh
	//cout << "going to train!" << endl;cout.flush();
	for (int i=0; i<nCuts; i++) {
		double cutCur = cuts[i];
		int numFaceErrors = 0;
		int numnonFaceErrors = 0;
		faceError = 0;
		nonfaceError = 0;
		for (int j=0; j<nfaces; j++) {
			if (!evalImgTrain(faces[j], cutCur)) {
				faceError += faceWeights[j];
				numFaceErrors ++;
			}
		}
		for (int j=0; j<nnonfaces; j++) {
			if (evalImgTrain(nonfaces[j], cutCur)) {
				nonfaceError += nonfaceWeights[j];	
				numnonFaceErrors ++;
			}
		}
		if (faceError + nonfaceError < errMin) {
			idxErrMin = i;
			faceErrors = numFaceErrors;
			nonfaceErrors = numnonFaceErrors;
			errMin = faceError + nonfaceError;
		}
	}
	cut = cuts[idxErrMin];
	return errMin;
}

string WeakLearner::forOutput() {
	stringstream ss;
	int funcId = 0;
	if (haar == &haarTwoHoriz) {
		funcId = 1;
	} else if (haar == &haarTwoVert) {
		funcId = 2;
	} else if (haar == &haarThreeHoriz) {
		funcId = 3;
	} else if (haar == &haarThreeVert) {
		funcId = 4;
	} else if (haar == &haarFour) {
		funcId = 5;
	}
	ss << rmin << " " << rmax << " " << cmin << " " << cmax << " " << p << " " << cut << " " <<  weight << " " << sumErr << " " << funcId;
	return ss.str();
}

void WeakLearner::print() {
	cout << "printing weak learner"<<endl;
	cout << "r goes " << rmin << " to " << rmax << endl;
	cout << "c goes " <<  cmin << " to " << cmax << endl;
	cout << "cut is " << cut << ", p is " << p << endl;
	cout << faceErrors << " face errors and " << nonfaceErrors << " non face" << endl;
	if (haar == &haarTwoHoriz) {
		cout << "am horizontal" << endl;
	} else if (haar == &haarTwoVert) {
		cout << "am vertical " << endl;
	} else if (haar == &haarThreeHoriz) {
		cout << "am three horiz " << endl;
	} else if (haar == &haarThreeVert) {
		cout << "am three vert" << endl;
	} else if (haar == &haarFour) {
		cout << "am four" << endl;
	}
}

pair<vector<double>, vector<double> > WeakLearner::yieldErrors(Grid *faces, int nfaces, Grid *nonfaces, int nnonfaces) {
	vector<double> faceErrors;
	vector<double> nonfaceErrors;
	faceErrors.reserve(nfaces);
	nonfaceErrors.reserve(nnonfaces);
	for (int i=0; i<nfaces; i++) {
		if (!evalImgTrain(faces[i], cut)) {
			faceErrors.push_back(1);
		} else {
			faceErrors.push_back(0);
		}
	}
	
	for (int i=0; i<nnonfaces; i++) {
		if (evalImgTrain(nonfaces[i], cut)) {
			nonfaceErrors.push_back(1);
		} else {
			nonfaceErrors.push_back(0);
		}
	}

	return make_pair(faceErrors, nonfaceErrors);
}

bool WeakLearner::evalImgTrain(Grid &img, double curCut) {
	double nr = img.nr;
	double nc = img.nc;
	int rImin = nr * rmin + .5; //.5 to round
	int rImax = nr * rmax + .5;
	int cImin = nc * cmin + .5;
	int cImax = nc * cmax + .5;
	double normFact = (rImax - rImin) * (cImax - cImin);
	return p * haar(img, rImin, rImax, cImin, cImax) / normFact < p * curCut;
}


bool WeakLearner::evalImg(Grid &img, int winRow, int winCol, int dWinRow, int dWinCol) {
	int rImin = winRow + dWinRow * rmin + .5;
	int rImax = winRow + dWinRow * rmax + .5;
	int cImin = winCol + dWinCol * cmin + .5;
	int cImax = winCol + dWinCol * cmax + .5;
	if (spew) {
		cout << rImin << ", " << rImax << ", " << cImin << ", " << cImax << endl;
	}
	double normFact = (rImax - rImin) * (cImax - cImin);
	return p * haar(img, rImin, rImax, cImin, cImax) / normFact < p * cut;
}
