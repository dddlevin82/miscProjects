#include "haar.h"


double getIntense(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	return img[rmax][cmax] - img[rmin][cmax] - img[rmax][cmin] + img[rmin][cmin];
}


double haarTwoHoriz(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int rcut = ((double) rmin + rmax) / 2 + .5;
	double iA = getIntense(img, rcut, rmax, cmin, cmax);
	double iB = getIntense(img, rmin, rcut, cmin, cmax);
	return iA - iB;
}

double haarTwoVert(Grid &img, int rmin, int rmax, int cmin, int cmax) {
	int ccut = ((double) cmin + cmax) / 2 + .5;
	double iA = getIntense(img, rmin, rmax, ccut, cmax);
	double iB = getIntense(img, rmin, rmax, cmin, ccut);
	return iA - iB;
}
