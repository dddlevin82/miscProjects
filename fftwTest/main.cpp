#include <fftw3.h>
#include <iostream>
#include <vector>
#include <math.h>
using namespace std;
int main() {

	int numDat = 10000;
	double spacing = 0.1;
	fftw_complex *in, *out;
	fftw_plan p;
	in = (fftw_complex *) fftw_malloc(sizeof(fftw_complex) * numDat);
	out = (fftw_complex *) fftw_malloc(sizeof(fftw_complex) * numDat);
	p = fftw_plan_dft_1d(numDat, in, out, FFTW_FORWARD, FFTW_ESTIMATE);

	vector<double> xs;
	for (int i=0; i<numDat; i++) {
		xs.push_back(spacing * i);
	}
	for (int i=0; i<numDat; i++) {
		in[i][0] = sin(xs[i]);
		in[i][1] = 0;
	}

	fftw_execute(p);
	for (int i=0; i<numDat; i++) {
		double real = out[i][0];
		double comp = out[i][1];
		double amp = sqrt(real*real + comp*comp);
		cout << amp << " ";
	}

}
