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
		trace = Vector(cmax - cmin, rmax - rmin);
		span = trace.len();
	}
	void spew() {
		cout << pos.y << " " << pos.x << " " << pos.y + trace.y << " " << pos.x + trace.x << endl;
	}
};

#endif
