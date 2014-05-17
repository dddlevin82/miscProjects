#ifndef FWINDOW_H
#define FWINDOW_H
#include "Vector.h"
class FWindow {
	public:
	Vector pos;
	Vector trace;
	double span;
	FWindow(double rmin, double rmax, double cmin, double cmax) {
		pos = Vector(cmin, rmin);
		trace = Vector(cmax - cmin, rmax - rmax);
		span = trace.len();
	}
};

#endif
