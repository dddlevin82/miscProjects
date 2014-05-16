#include "haar.h"


double getIntense(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	cout << "at max " << img[rmax][cmax] << endl;
	return img[rmax][cmax] - img[rmin][cmax] - img[rmax][cmin] + img[rmin][cmin];
}


double haarTwoHoriz(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int rcut = ((double) rmin + rmax) / 2 + .5;
	cout << "in haar " << rmin << ", " << rmax << ", " << cmin << ", " << cmax << endl;
	double iA = getIntense(img, rmin, rcut, cmin, cmax);
	double iB = getIntense(img, rcut, rmax, cmin, cmax);
	cout << "iA " << iA << ", iB " << iB << endl;
	return iA - iB;
}

double haarTwoVert(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int ccut = ((double) cmin + cmax) / 2 + .5;
	double iA = getIntense(img, rmin, rmax, ccut, cmax);
	double iB = getIntense(img, rmin, rmax, cmin, ccut);
	return iA - iB;
}
