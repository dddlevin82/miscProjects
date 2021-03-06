#include "haar.h"
extern bool spew;

double getIntense(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	return img[rmax][cmax] - img[rmin][cmax] - img[rmax][cmin] + img[rmin][cmin];
}


double haarTwoHoriz(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int rcut = ((double) rmin + rmax) / 2 + .5;
	double iA = getIntense(img, rmin, rcut, cmin, cmax);
	double iB = getIntense(img, rcut, rmax, cmin, cmax);
	/*
	cout << "rmax " << rmax << endl;
	cout << "rmin " << rmin << endl;
	cout << "cmin " << cmin << endl;
	cout << "cmax " << cmax << endl;
	cout << "rcut " << rcut << endl;
	cout << "iA " << iA << " ib " << iB << endl;
	*/
	return iA - iB;
}

double haarTwoVert(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int ccut = ((double) cmin + cmax) / 2 + .5;
/*	
	if (spew) {
		cout << "b";
		cout << ccut<<endl;
		cout << "r max " << rmax << endl;
		cout << img[rmax][cmax-1] << endl;cout.flush();
	}
	*/
	double iA = getIntense(img, rmin, rmax, ccut, cmax);
	double iB = getIntense(img, rmin, rmax, cmin, ccut);
	return iA - iB;
}


double haarThreeHoriz(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int rcutLow = rmin + ((double) rmax - rmin) / 3 + .5;
	int rcutHigh = rmin + ((double) rmax - rmin) * 2.0 / 3.0 + .5;
	double iA = getIntense(img, rmin, rcutLow, cmin, cmax);
	double iB = getIntense(img, rcutLow, rcutHigh, cmin, cmax);
	double iC = getIntense(img, rcutHigh, rmax, cmin, cmax);
	return iB - iA - iC;
}

double haarThreeVert(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int ccutLow = cmin + (double) (cmax - cmin) / 3 + .5;
	int ccutHigh = cmin + (double) (cmax - cmin) * 2.0 / 3.0 + .5;
	double iA = getIntense(img, rmin, rmax, cmin, ccutLow);
	double iB = getIntense(img, rmin, rmax, ccutLow, ccutHigh);
	double iC = getIntense(img, rmin, rmax, ccutHigh, cmax);
	return iB - iA - iC;
}


double haarFour(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int rcut = rmin + .5 * (rmax - rmin) + .5;
	int ccut = cmin + .5 * (cmax - cmin) + .5;
	double iA = getIntense(img, rmin, rcut, cmin, ccut);
	double iB = getIntense(img, rcut, rmax, cmin, ccut);
	double iC = getIntense(img, rmin, rcut, ccut, cmax);
	double iD = getIntense(img, rcut, rmax, ccut, cmax);
	return (iA + iD) - (iB + iC);

}
