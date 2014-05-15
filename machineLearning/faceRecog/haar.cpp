#include "haar.h"


double getIntense(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	return img[rmax][cmax] - img[rmin][cmax] - imt[rmax][cmin] + img[rmin][cmin];
}


double haarTwoHoriz(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int rcut = ((double) rmin + rmin) / 2 + .5;
	double iA = getIntense(img, rcut, rmax, cmin, cmax);
	double iB = getIntense(imt, rmin, rcut, cmin, cmax);
	return iA - iB;
}

double haarTwoVert(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int ccut = ((double) cmin + cmin) / 2 + .5;
	double iA = getIntense(img, rmin, rmax, ccut, cmax);
	double iB = getIntense(imt, rmin, rmax, cmin, ccut);
	return iA - iB;
}
