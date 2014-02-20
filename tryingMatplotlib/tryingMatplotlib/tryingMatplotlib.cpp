// tryingMatplotlib.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <vector>
#include <string>
#include <sstream>
using namespace std;


class Bounds {
public:
	double xlo;
	double xhi;
	double ylo;
	double yhi;
	int *boo(double *);
	vector<int> foo;
	void grok(vector<int> *);
	Bounds() {
		xlo = 0;
		xhi = 0;
		ylo = 0;
		yhi = 0;
	}


};
void Bounds::grok(vector<int> *blah) {
	//int boop = blah->
	int foo[3];
	foo[1];
}

void boo(double foo) {
	int blah[4];
	blah[0] = 5;

	ostringstream strs;
	strs<<3.4324;
	string str = strs.str();

	foo += 5;
}

int _tmain(int aregc, _TCHAR* argv[])
{
	boo(4);
	return 0;
}

