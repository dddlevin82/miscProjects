// blockInvPP.cpp : Defines the entry point for the console application.
//
#include "stdafx.h"
#include "Matrix.h"
#include <math.h>
#include <stdio.h>
#include <windows.h> 
#include <WinBase.h>
#include <tchar.h>
#include <strsafe.h>
#define numProc 8
using namespace std;

struct ClimbParam {
	vector<Matrix> *pfxs;
	int i;
	int k;
};

struct SolveYParam {
	vector<SplitMatrix> *UVs;
	vector<SplitMatrix> *MHs;
	vector<Matrix> *zs;
	vector<Matrix> *ys;
	int i;
};

Matrix forwardSubCol(Matrix &coefs, Matrix &eqls) {
	Matrix xs = Matrix(eqls.rows.size(), 1);
	for (int y=0; y<coefs.rows.size(); y++) {
		double sum = 0;
		for (int x=0; x<y; x++) {
			sum += coefs.rows[y][x] * xs.rows[x][0];

		}
		xs.rows[y][0] = eqls.rows[y][0] -sum / coefs.rows[y][y];
	}
	return xs;
}

Matrix forwardSub(Matrix &coefs, Matrix &eqls) {
	Matrix xs = Matrix(coefs.rows.size(), 0);
	for (int x=0; x<eqls.rows[0].size(); x++) {
		Matrix eqlsCol = eqls.sliceCol(x);
		Matrix xsCol = forwardSubCol(coefs, eqlsCol);
		xs.appendCol(xsCol);
	}
	return xs;

}

vector<Matrix> sliceLs(Matrix coefs, int blockSize) {
	vector<Matrix> ls;
	for (int i=0; i<(int)coefs.rows.size() / blockSize; i++) {
		ls.push_back(coefs.sliceBlock(i * blockSize, i * blockSize, blockSize, blockSize));
	}
	return ls;
}

vector<Matrix> sliceRs(Matrix coefs, int blockSize) {
	vector<Matrix> rs;
	for (int i=1; i<(int)coefs.rows.size() / blockSize; i++) {
		rs.push_back(coefs.sliceBlock(i * blockSize, (i - 1) * blockSize, blockSize, blockSize));
	}
	return rs;
}

vector<Matrix> calcGs(vector<Matrix> &rs, vector<Matrix> &ls) {
	vector<Matrix> gs;
	for (int i=0; i<rs.size(); i++) {
		gs.push_back(forwardSub(ls[i+1], rs[1]));
	}
	return gs;

}

vector<Matrix> calcBis(vector<Matrix> &ls, vector<Matrix> &ansBlocks) {
	vector<Matrix> bis;
	for (int i=0; i<ls.size(); i++) {
		bis.push_back(forwardSub(ls[i], ansBlocks[i]));
	}
	return bis;
}

vector<Matrix> makeGHats(vector<Matrix> &gs, int blockSize, int bandwidth) {
	vector<Matrix> gHats;
	int firstZero = blockSize - bandwidth;
	for (int i=0; i<gs.size(); i++) {
		Matrix gHat = Matrix(blockSize, bandwidth);
		for (int y=0; y<blockSize; y++) {
			for (int x=0; x<bandwidth; x++) {
				gHat.rows[y][x] = gs[i].rows[y][firstZero + x];
			}

		}
		gHats.push_back(gHat);
	}
	return gHats;
}

vector<SplitMatrix> splitByBand(vector<Matrix> &mtx, int blockSize, int bandwidth) {
	vector<SplitMatrix> split;
	for (int i=0; i<mtx.size(); i++) {
        Matrix top = mtx[i].sliceRows(0, blockSize - bandwidth);
        Matrix bot = mtx[i].sliceRows(blockSize - bandwidth, blockSize);
		split.push_back(SplitMatrix(top, bot)); 
	}
	return split;
}

vector<Matrix> solveZsBlockInv(vector<SplitMatrix> &UVs, vector<SplitMatrix> &MHs) {
	vector<Matrix> zs;
	zs.push_back(UVs[0].bottom);
	for (int i=1; i<UVs.size(); i++) {
		zs.push_back(UVs[i].bottom - MHs[i-1].bottom * zs[i-1]);
	}
	return zs;
}

vector<Matrix> assemblePrefixComponents(vector<SplitMatrix> &MHs, vector<SplitMatrix> &UVs) {
	vector<Matrix> comps;
	Matrix first = Matrix(UVs[0].bottom.rows.size() + 1, MHs[0].bottom.rows[0].size() + UVs[0].bottom.rows[0].size());
	first.populateCol(first.rows[0].size() - 1, 1);
	first.pasteIn(UVs[0].bottom, 0, MHs[0].bottom.rows[0].size());
	comps.push_back(first);
	for (int i=0; i<MHs.size(); i++) {
		Matrix compNew = Matrix(UVs[0].bottom.rows.size() + 1, MHs[0].bottom.rows[0].size() + UVs[0].bottom.rows[0].size());
		compNew.populateCol(compNew.rows[0].size() - 1, 1);
		compNew.pasteIn(MHs[i].bottom * -1, 0, 0);
		compNew.pasteIn(UVs[i + 1].bottom, 0, MHs[0].bottom.rows[0].size());
		comps.push_back(compNew);
	}
	return comps;
}

DWORD WINAPI climbUp(LPVOID lpParam) {
	ClimbParam param = *((ClimbParam*) lpParam);
	if (param.i + param.k < param.pfxs->size()) {
		(*param.pfxs)[param.i+param.k] = param.pfxs->at(param.i+param.k) * param.pfxs->at(param.i); 
	}
	return 0;
}


vector<Matrix> solvePrefixSerial(vector<Matrix> &xs) {

    int n = xs.size();
    int numLevels = (int) (log((double) xs.size()) / log(2.) + .5); 
    for (int i=0; i<numLevels; i++) {
        int stepSize = (unsigned int) pow(2., i + 1);
        int lookForward = (unsigned int) pow(2., i);
        int start = pow(2., i) - 1;
        for (int j=start; j<xs.size(); j+=stepSize) {
            xs[j+lookForward] = xs[j+lookForward] * xs[j];
        }
    }

    for (int k = (unsigned int) pow(2.,n-1.); k>0; k/=2) {
        for (int i=k-1; i<n-1; i+=k) {
            xs[i+k] = xs[i+k] * xs[i];
        }
    }
        return xs;
}



vector<Matrix> solvePrefix(vector<Matrix> &xs) {
	const int numThreads = numProc / 2;
    int n = xs.size();
    int numLevels = (int) (log((double) xs.size()) / log(2.) + .5); 
    for (int i=0; i<numLevels; i++) {
        int stepSize = (unsigned int) pow(2., i + 1);
        int lookForward = (unsigned int) pow(2., i);
        int start = pow(2., i) - 1;
		int numSteps = (n - start) / stepSize;

		HANDLE threadHandles[numThreads];
		ClimbParam upParams[numThreads];
		int threadStart = start;
		ClimbParam params[numThreads];
		for (int i=0; i<sizeof(threadHandles) / sizeof(int); i++) {
			ClimbParam next;
			next.i = threadStart;
			next.k = lookForward;
			next.pfxs = &xs;
			params[i] = next;
			threadStart += stepSize;
			HANDLE nextHandle = CreateThread(NULL, 0, climbUp, &params[i], 0, NULL);
			threadHandles[i] = nextHandle;
		}
		WaitForMultipleObjects(numThreads, threadHandles, TRUE, INFINITE);
		for (int i=0; i<sizeof(threadHandles) / sizeof(int); i++) {
			CloseHandle(threadHandles[i]);
		}
	}
    for (int k = xs.size()/2; k>1; k/=2) {
		HANDLE threadHandles[numThreads];
		ClimbParam params[numThreads];
		for (int t=0, i=k-1; t<sizeof(threadHandles) / sizeof(int); t++, i+=k) {
			ClimbParam next;
			next.i = i;
			next.k = (k + 1) / 2;
			next.pfxs = &xs;
			params[t] = next;
			HANDLE nextHandle = CreateThread(NULL, 0, climbUp, &params[t], 0, NULL);
			threadHandles[t] = nextHandle;
		}
		WaitForMultipleObjects(numThreads, threadHandles, TRUE, INFINITE);
		for (int i=0; i<sizeof(threadHandles) / sizeof(int); i++) {
			CloseHandle(threadHandles[i]);
		}
	}
	return xs;
}

vector<Matrix> solveZsPrefix(vector<SplitMatrix> MHs, vector<SplitMatrix> UVs, vector<Matrix> (*pfxFunc)(vector<Matrix>&)) {
	vector<Matrix> continComponents = assemblePrefixComponents(MHs, UVs);
	vector<Matrix> prefixes = pfxFunc(continComponents);
	vector<Matrix> zs;
	for (int i=0; i<prefixes.size(); i++) {
		zs.push_back(prefixes[i].sliceBlock(0, prefixes[0].rows[0].size()-1, prefixes[0].rows.size() - 1, 1));
	}
	return zs;
}

vector<Matrix> solveYsSerial(vector<SplitMatrix> &UVs, vector<SplitMatrix> &MHs, vector<Matrix> &zs) {
        vector<Matrix> ys;
        ys.push_back(UVs[0].top);
        for (int i=1; i<UVs.size(); i++) {
                ys.push_back(UVs[i].top - MHs[i-1].top * zs[i-1]);
        }
        return ys;
}

DWORD WINAPI firstY (LPVOID lpParam) {
	SolveYParam first = *((SolveYParam*) lpParam);
	(*first.ys)[0] = (*first.UVs)[0].top;
	return 0;
}

DWORD WINAPI restYs (LPVOID lpParam) {
	SolveYParam param = *((SolveYParam*) lpParam);
	(*param.ys)[param.i] = (*param.UVs)[param.i].top - (*param.MHs)[param.i-1].top * (*param.zs)[param.i-1];
	return 0;
}

vector<Matrix> solveYs(vector<SplitMatrix> &UVs, vector<SplitMatrix> &MHs, vector<Matrix> &zs) {
	vector<Matrix> ys;
	ys.reserve(zs.size());
	for (int i=0; i<UVs.size(); i++) {
		ys.push_back(Matrix(0, 0));
	}
	HANDLE yHandles[numProc];
	SolveYParam params[numProc];
	SolveYParam firstParam;
	firstParam.i = 0;
	firstParam.UVs = &UVs;
	firstParam.ys = &ys;
	params[0] = firstParam;
	yHandles[0] = CreateThread(NULL, 0, firstY, &params[0], 0, NULL);
	for (int i=1; i<UVs.size(); i++) {
		SolveYParam next;
		next.i = i;
		next.ys = &ys;
		next.UVs = &UVs;
		next.MHs = &MHs;
		next.zs = &zs;
		params[i] = next;
		yHandles[i] = CreateThread(NULL, 0, restYs, &params[i], 0, NULL);
	}
	WaitForMultipleObjects(numProc, yHandles, TRUE, INFINITE);
	for (int i=0; i<sizeof(yHandles) / sizeof(int); i++) {
		CloseHandle(yHandles[i]);
	}
	return ys;
}

Matrix assembleXs(vector<Matrix> &ys, vector<Matrix> &zs) {
	Matrix xs = Matrix(ys.size() * ys[0].rows.size() + zs.size() * zs[0].rows.size(), 1);
	int idx = 0;
	for (int i=0; i<ys.size(); i++) {
		for (int j=0; j<ys[i].rows.size(); j++) {
			xs.rows[idx][0] = ys[i].rows[j][0];
			idx++;
		}
		for (int k=0; k<zs[i].rows.size(); k++) {
			xs.rows[idx][0] = zs[i].rows[k][0];
			idx++;
		}
	}
	return xs;
}

Matrix solveXs(vector<Matrix> &ls, vector<Matrix> &bis, vector<Matrix> &ans, vector<Matrix> &gs, int bandwidth, vector<Matrix> (*pfxFunc)(vector<Matrix>&), vector<Matrix>(*ysFunc)(vector<SplitMatrix> &, vector<SplitMatrix> &, vector<Matrix> &)) {
	int blockSize = ls[0].rows.size();
	vector<Matrix> gHats = makeGHats(gs, blockSize, bandwidth);
	vector<SplitMatrix> MHs = splitByBand(gHats, blockSize, bandwidth);
	vector<SplitMatrix> UVs = splitByBand(bis, blockSize, bandwidth);
	vector<Matrix> zs = solveZsPrefix(MHs, UVs, pfxFunc);
    
	vector<Matrix> ys = ysFunc(UVs, MHs, zs);
	Matrix xs = assembleXs(ys, zs);
	return xs;
}
int getTime() {
	SYSTEMTIME time;
	GetSystemTime(&time);
	return 60000 * time.wMinute + 1000 * time.wSecond + time.wMilliseconds;
}
Matrix makeCoefs(int mtxSize) {
	Matrix coefs = Matrix(mtxSize, mtxSize);
	coefs.populateDiagonal(0, 0, 1);
	coefs.populateDiagonal(1, 0, -1);
	return coefs;
}

int timeSolveFS(int mtxSize) {
	int blockSize = mtxSize / numProc;
	Matrix coefs = makeCoefs(mtxSize);
	Matrix ans = Matrix(mtxSize, 1);
	ans.populateCol(0, 1);
	int timeBefore = getTime();
	Matrix xs = forwardSub(coefs, ans);
	int dt = getTime() - timeBefore;
	return dt;

}
int timeSolvePP(int mtxSize, vector<Matrix> (*pfxFunc)(vector<Matrix>&), vector<Matrix>(*ysFunc)(vector<SplitMatrix> &, vector<SplitMatrix> &, vector<Matrix> &)) {

	int blockSize = mtxSize / numProc;
	Matrix coefs = makeCoefs(mtxSize);
	Matrix ans = Matrix(mtxSize, 1);
	ans.populateCol(0, 1);
	int timeBefore = getTime();
	vector<Matrix> rs = sliceRs(coefs, blockSize);
	vector<Matrix> ls = sliceLs(coefs, blockSize);
	vector<Matrix> gs = calcGs(rs, ls);
	int bandwidth = 2;

	vector<Matrix> ansBlocks = ans.asRowBlocks(blockSize);
	vector<Matrix> bis = calcBis(ls, ansBlocks);
	Matrix xs = solveXs(ls, bis, ansBlocks, gs, bandwidth, pfxFunc, ysFunc);
	int dt = getTime() - timeBefore;
	return dt;
}

int main(int argc, char *argv[])
{
	const int numSteps = 10;
	int timesPPP[numSteps];
	int timesFS[numSteps];
	int timesPPS[numSteps];
	int sizes[numSteps];
	int matrixSize = 32;
	vector<Matrix> (*pfxSerial)(vector<Matrix>&) = solvePrefixSerial;
	vector<Matrix> (*pfxPar)(vector<Matrix>&) = solvePrefix;

	vector<Matrix> (*ysSerial)(vector<SplitMatrix> &, vector<SplitMatrix> &, vector<Matrix> &) = solveYsSerial;
	vector<Matrix> (*ysPar)(vector<SplitMatrix> &, vector<SplitMatrix> &, vector<Matrix> &) = solveYs;
	for (int i=0; i<sizeof(timesPPP)/sizeof(int); i++) {
		timesPPS[i] = timeSolvePP(matrixSize, pfxSerial, ysSerial);
		timesPPP[i] = timeSolvePP(matrixSize, pfxSerial, ysSerial);
		timesFS[i] = timeSolveFS(matrixSize);

		sizes[i] = matrixSize;
		matrixSize *= 2;
	}

	
	return 0;
}

